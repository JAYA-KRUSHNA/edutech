import * as tf from '@tensorflow/tfjs';

/**
 * ═══════════════════════════════════════════════════════════════
 * Denoising Autoencoder — Enhanced Weak Area Detector
 * ═══════════════════════════════════════════════════════════════
 *
 * Architecture:
 *   Input (N subjects) + Gaussian Noise(0.1)
 *   → Encoder: Dense(N, ReLU) → Dense(ceil(N/2), ReLU) → Dense(latent, ReLU)
 *   → Decoder: Dense(ceil(N/2), ReLU) → Dense(N, Sigmoid)
 *
 * Uses reconstruction error + z-score anomaly detection to identify
 * subjects where the student's performance deviates significantly
 * from their overall pattern — indicating true weak areas, not just
 * low scores.
 */

export interface WeakAreaResult {
  subject: string;
  score: number;
  reconstructed: number;
  error: number;
  zScore: number;
  isWeak: boolean;
  severity: 'critical' | 'moderate' | 'mild';
}

export interface WeakAreaAnalysis {
  weakAreas: WeakAreaResult[];
  overallError: number;
  subjectCount: number;
  latentDim: number;
}

/**
 * Aggregate quiz attempts into per-subject performance scores
 */
export function aggregateBySubject(
  attempts: Array<{ score: number; total: number; quiz_subject: string }>
): Map<string, { avgScore: number; attemptCount: number }> {
  const subjectMap = new Map<string, { totalScore: number; totalMax: number; count: number }>();

  for (const a of attempts) {
    const existing = subjectMap.get(a.quiz_subject) || { totalScore: 0, totalMax: 0, count: 0 };
    existing.totalScore += a.score;
    existing.totalMax += a.total;
    existing.count += 1;
    subjectMap.set(a.quiz_subject, existing);
  }

  const result = new Map<string, { avgScore: number; attemptCount: number }>();
  for (const [subject, data] of subjectMap) {
    result.set(subject, {
      avgScore: data.totalMax > 0 ? data.totalScore / data.totalMax : 0,
      attemptCount: data.count,
    });
  }
  return result;
}

/**
 * Build enhanced autoencoder with noise injection
 */
function buildAutoencoder(inputDim: number) {
  const latentDim = Math.max(2, Math.floor(inputDim / 3));
  const hiddenDim1 = Math.max(latentDim + 2, Math.ceil(inputDim * 0.75));
  const hiddenDim2 = Math.max(latentDim + 1, Math.ceil(inputDim / 2));

  const input = tf.input({ shape: [inputDim] });

  // Encoder (noise is added to training data instead of as a layer)
  const enc1 = tf.layers.dense({ units: hiddenDim1, activation: 'relu', kernelInitializer: 'heNormal' }).apply(input);
  const enc2 = tf.layers.dense({ units: hiddenDim2, activation: 'relu' }).apply(enc1);
  const latent = tf.layers.dense({ units: latentDim, activation: 'relu', name: 'latent' }).apply(enc2) as tf.SymbolicTensor;

  // Decoder
  const dec1 = tf.layers.dense({ units: hiddenDim2, activation: 'relu' }).apply(latent);
  const dec2 = tf.layers.dense({ units: hiddenDim1, activation: 'relu' }).apply(dec1);
  const output = tf.layers.dense({ units: inputDim, activation: 'sigmoid' }).apply(dec2) as tf.SymbolicTensor;

  const autoencoder = tf.model({ inputs: input, outputs: output });
  autoencoder.compile({ optimizer: tf.train.adam(0.008), loss: 'meanSquaredError' });

  return { autoencoder, latentDim };
}

/**
 * Generate diverse training profiles
 */
function generateTrainingProfiles(numSubjects: number, baseScores: number[]): tf.Tensor2D {
  const profiles: number[][] = [];

  // Student's own profile with noise variations
  for (let i = 0; i < 40; i++) {
    profiles.push(baseScores.map(s => Math.max(0, Math.min(1, s + (Math.random() - 0.5) * 0.25))));
  }

  // Diverse synthetic profiles
  for (let i = 0; i < 60; i++) {
    const baseLevel = Math.random();
    const profile: number[] = [];
    for (let j = 0; j < numSubjects; j++) {
      // Some subjects strong, some weak — creates natural patterns
      const subjectBias = (Math.random() - 0.5) * 0.4;
      profile.push(Math.max(0, Math.min(1, baseLevel + subjectBias + (Math.random() - 0.5) * 0.2)));
    }
    profiles.push(profile);
  }

  return tf.tensor2d(profiles);
}

/**
 * Detect weak areas using autoencoder + z-score analysis
 */
export async function detectWeakAreas(
  attempts: Array<{ score: number; total: number; quiz_subject: string }>
): Promise<WeakAreaAnalysis> {
  const subjectPerf = aggregateBySubject(attempts);
  const subjects = Array.from(subjectPerf.keys());

  if (subjects.length < 2) {
    const results: WeakAreaResult[] = subjects.map(s => ({
      subject: s,
      score: Math.round((subjectPerf.get(s)?.avgScore || 0) * 100),
      reconstructed: Math.round((subjectPerf.get(s)?.avgScore || 0) * 100),
      error: 0, zScore: 0,
      isWeak: (subjectPerf.get(s)?.avgScore || 0) < 0.5,
      severity: ((subjectPerf.get(s)?.avgScore || 0) < 0.3 ? 'critical' : 'mild') as WeakAreaResult['severity'],
    }));
    return { weakAreas: results, overallError: 0, subjectCount: subjects.length, latentDim: 0 };
  }

  const scores = subjects.map(s => subjectPerf.get(s)?.avgScore || 0);
  const { autoencoder, latentDim } = buildAutoencoder(subjects.length);
  const trainingData = generateTrainingProfiles(subjects.length, scores);

  // Train with early-stopping-like approach (more epochs for better reconstruction)
  await autoencoder.fit(trainingData, trainingData, {
    epochs: 60,
    batchSize: 16,
    verbose: 0,
    shuffle: true,
  });

  const inputTensor = tf.tensor2d([scores]);
  const reconstructed = autoencoder.predict(inputTensor) as tf.Tensor;
  const reconScores = await reconstructed.data();

  // Per-subject error
  const errors = subjects.map((_, i) => Math.abs(scores[i] - reconScores[i]));
  const meanError = errors.reduce((s, e) => s + e, 0) / errors.length;
  const stdError = Math.sqrt(errors.reduce((s, e) => s + (e - meanError) ** 2, 0) / errors.length);

  const results: WeakAreaResult[] = subjects.map((subject, i) => {
    const error = errors[i];
    const zScore = stdError > 0 ? (error - meanError) / stdError : 0;
    const isWeak = scores[i] < 0.5 || (error > meanError + stdError * 0.5 && scores[i] < 0.7);
    const severity: WeakAreaResult['severity'] =
      scores[i] < 0.3 ? 'critical' : scores[i] < 0.5 || zScore > 1.5 ? 'moderate' : 'mild';

    return {
      subject,
      score: Math.round(scores[i] * 100),
      reconstructed: Math.round(reconScores[i] * 100),
      error: Math.round(error * 1000) / 1000,
      zScore: Math.round(zScore * 100) / 100,
      isWeak,
      severity,
    };
  });

  results.sort((a, b) => {
    if (a.isWeak !== b.isWeak) return a.isWeak ? -1 : 1;
    return a.score - b.score;
  });

  trainingData.dispose(); inputTensor.dispose(); reconstructed.dispose(); autoencoder.dispose();

  return {
    weakAreas: results,
    overallError: Math.round(meanError * 1000) / 1000,
    subjectCount: subjects.length,
    latentDim,
  };
}
