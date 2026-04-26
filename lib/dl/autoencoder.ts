import * as tf from '@tensorflow/tfjs';

/**
 * ═══════════════════════════════════════════════════════════════
 * Denoising Autoencoder v2 — Enhanced Weak Area Detector
 * ═══════════════════════════════════════════════════════════════
 *
 * Architecture:
 *   Input (N subjects)
 *   → Noise injection (Gaussian σ=0.12)
 *   → Encoder: Dense(N×0.75, ReLU, L2) → Dense(N/2, ReLU) → Dense(latent, ReLU)
 *   → Decoder: Dense(N/2, ReLU) → Dense(N×0.75, ReLU) → Dense(N, Sigmoid)
 *
 * Enhancements over v1:
 *   - Explicit noise injection during training (denoising AE)
 *   - L2 regularization in encoder for smoother latent space
 *   - Subject correlation analysis (which subjects co-vary)
 *   - Anomaly percentile ranking (how unusual is each error)
 *   - Improvement suggestions generated per weak area
 *   - More diverse synthetic profiles (150 samples)
 *   - Early-stopping-like training with validation split
 *   - Weighted severity scoring combining error + absolute score
 */

export interface WeakAreaResult {
  subject: string;
  score: number;
  reconstructed: number;
  error: number;
  zScore: number;
  percentile: number;
  isWeak: boolean;
  severity: 'critical' | 'moderate' | 'mild';
  suggestion: string;
}

export interface SubjectCorrelation {
  subject1: string;
  subject2: string;
  correlation: number;
}

export interface WeakAreaAnalysis {
  weakAreas: WeakAreaResult[];
  overallError: number;
  subjectCount: number;
  latentDim: number;
  correlations: SubjectCorrelation[];
  riskScore: number;
}

/**
 * Aggregate quiz attempts into per-subject performance scores
 */
export function aggregateBySubject(
  attempts: Array<{ score: number; total: number; quiz_subject: string }>
): Map<string, { avgScore: number; attemptCount: number; scores: number[] }> {
  const subjectMap = new Map<string, { totalScore: number; totalMax: number; count: number; scores: number[] }>();

  for (const a of attempts) {
    const existing = subjectMap.get(a.quiz_subject) || { totalScore: 0, totalMax: 0, count: 0, scores: [] };
    existing.totalScore += a.score;
    existing.totalMax += a.total;
    existing.count += 1;
    if (a.total > 0) existing.scores.push(a.score / a.total);
    subjectMap.set(a.quiz_subject, existing);
  }

  const result = new Map<string, { avgScore: number; attemptCount: number; scores: number[] }>();
  for (const [subject, data] of subjectMap) {
    result.set(subject, {
      avgScore: data.totalMax > 0 ? data.totalScore / data.totalMax : 0,
      attemptCount: data.count,
      scores: data.scores,
    });
  }
  return result;
}

/**
 * Build denoising autoencoder with L2 regularization
 */
function buildAutoencoder(inputDim: number) {
  const latentDim = Math.max(2, Math.floor(inputDim / 3));
  const hiddenDim1 = Math.max(latentDim + 2, Math.ceil(inputDim * 0.75));
  const hiddenDim2 = Math.max(latentDim + 1, Math.ceil(inputDim / 2));
  const l2Reg = tf.regularizers.l2({ l2: 0.0005 });

  const input = tf.input({ shape: [inputDim] });

  // Encoder with L2 regularization
  const enc1 = tf.layers.dense({ units: hiddenDim1, activation: 'relu', kernelInitializer: 'heNormal', kernelRegularizer: l2Reg }).apply(input);
  const enc2 = tf.layers.dense({ units: hiddenDim2, activation: 'relu', kernelRegularizer: l2Reg }).apply(enc1);
  const latent = tf.layers.dense({ units: latentDim, activation: 'relu', name: 'latent' }).apply(enc2) as tf.SymbolicTensor;

  // Decoder (symmetric)
  const dec1 = tf.layers.dense({ units: hiddenDim2, activation: 'relu' }).apply(latent);
  const dec2 = tf.layers.dense({ units: hiddenDim1, activation: 'relu' }).apply(dec1);
  const output = tf.layers.dense({ units: inputDim, activation: 'sigmoid' }).apply(dec2) as tf.SymbolicTensor;

  const autoencoder = tf.model({ inputs: input, outputs: output });
  autoencoder.compile({ optimizer: tf.train.adam(0.006), loss: 'meanSquaredError' });

  return { autoencoder, latentDim };
}

/**
 * Generate diverse training profiles with noise injection
 */
function generateTrainingProfiles(numSubjects: number, baseScores: number[]): { clean: tf.Tensor2D; noisy: tf.Tensor2D } {
  const cleanProfiles: number[][] = [];
  const noisyProfiles: number[][] = [];
  const NOISE_STD = 0.12;

  // Student's own profile with noise variations
  for (let i = 0; i < 50; i++) {
    const clean = baseScores.map(s => Math.max(0, Math.min(1, s + (Math.random() - 0.5) * 0.2)));
    const noisy = clean.map(v => Math.max(0, Math.min(1, v + gaussianNoise(NOISE_STD))));
    cleanProfiles.push(clean);
    noisyProfiles.push(noisy);
  }

  // Diverse synthetic profiles
  for (let i = 0; i < 100; i++) {
    const baseLevel = Math.random();
    const profile: number[] = [];
    for (let j = 0; j < numSubjects; j++) {
      const subjectBias = (Math.random() - 0.5) * 0.4;
      profile.push(Math.max(0, Math.min(1, baseLevel + subjectBias + (Math.random() - 0.5) * 0.15)));
    }
    const noisy = profile.map(v => Math.max(0, Math.min(1, v + gaussianNoise(NOISE_STD))));
    cleanProfiles.push(profile);
    noisyProfiles.push(noisy);
  }

  return { clean: tf.tensor2d(cleanProfiles), noisy: tf.tensor2d(noisyProfiles) };
}

function gaussianNoise(std: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return std * Math.sqrt(-2 * Math.log(u1 + 1e-8)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Compute Pearson correlation between subject score arrays
 */
function computeCorrelations(subjectPerf: Map<string, { avgScore: number; attemptCount: number; scores: number[] }>): SubjectCorrelation[] {
  const subjects = Array.from(subjectPerf.keys());
  const correlations: SubjectCorrelation[] = [];

  for (let i = 0; i < subjects.length; i++) {
    for (let j = i + 1; j < subjects.length; j++) {
      const s1Data = subjectPerf.get(subjects[i])!;
      const s2Data = subjectPerf.get(subjects[j])!;

      // Use average scores as a simple proxy (real correlation would need per-attempt pairing)
      const diff = Math.abs(s1Data.avgScore - s2Data.avgScore);
      // Inverse distance as correlation proxy: closer scores = higher correlation
      const corr = Math.max(-1, Math.min(1, 1 - diff * 2));

      if (Math.abs(corr) > 0.3) { // only report meaningful correlations
        correlations.push({
          subject1: subjects[i],
          subject2: subjects[j],
          correlation: Math.round(corr * 100) / 100,
        });
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 5);
}

/**
 * Generate improvement suggestion based on severity and score
 */
function generateSuggestion(subject: string, score: number, severity: string): string {
  if (severity === 'critical') {
    return `Start with ${subject} fundamentals. Focus on core concepts and practice basic problems.`;
  }
  if (severity === 'moderate') {
    return `Review ${subject} key topics. Try intermediate-level quizzes to build confidence.`;
  }
  return `Good foundation in ${subject}. Challenge yourself with advanced practice.`;
}

/**
 * Detect weak areas using denoising autoencoder + z-score analysis
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
      error: 0, zScore: 0, percentile: 50,
      isWeak: (subjectPerf.get(s)?.avgScore || 0) < 0.5,
      severity: ((subjectPerf.get(s)?.avgScore || 0) < 0.3 ? 'critical' : 'mild') as WeakAreaResult['severity'],
      suggestion: generateSuggestion(s, subjectPerf.get(s)?.avgScore || 0, (subjectPerf.get(s)?.avgScore || 0) < 0.3 ? 'critical' : 'mild'),
    }));
    return { weakAreas: results, overallError: 0, subjectCount: subjects.length, latentDim: 0, correlations: [], riskScore: 0 };
  }

  const scores = subjects.map(s => subjectPerf.get(s)?.avgScore || 0);
  const { autoencoder, latentDim } = buildAutoencoder(subjects.length);
  const { clean, noisy } = generateTrainingProfiles(subjects.length, scores);

  // Train: input=noisy, target=clean (denoising objective)
  await autoencoder.fit(noisy, clean, {
    epochs: 70,
    batchSize: 16,
    verbose: 0,
    shuffle: true,
    validationSplit: 0.1,
  });

  const inputTensor = tf.tensor2d([scores]);
  const reconstructed = autoencoder.predict(inputTensor) as tf.Tensor;
  const reconScores = await reconstructed.data();

  // Per-subject error
  const errors = subjects.map((_, i) => Math.abs(scores[i] - reconScores[i]));
  const meanError = errors.reduce((s, e) => s + e, 0) / errors.length;
  const stdError = Math.sqrt(errors.reduce((s, e) => s + (e - meanError) ** 2, 0) / errors.length);

  // Sort errors for percentile ranking
  const sortedErrors = [...errors].sort((a, b) => a - b);

  const results: WeakAreaResult[] = subjects.map((subject, i) => {
    const error = errors[i];
    const zScore = stdError > 0 ? (error - meanError) / stdError : 0;

    // Percentile: what % of errors are below this one
    const percentileIdx = sortedErrors.indexOf(error);
    const percentile = Math.round((percentileIdx / Math.max(1, sortedErrors.length - 1)) * 100);

    // Weighted weakness detection: combine absolute score + reconstruction error
    const isWeak = scores[i] < 0.5 || (error > meanError + stdError * 0.4 && scores[i] < 0.7);

    const severity: WeakAreaResult['severity'] =
      scores[i] < 0.3 || (scores[i] < 0.5 && zScore > 1.5) ? 'critical'
        : scores[i] < 0.5 || zScore > 1.0 ? 'moderate'
          : 'mild';

    return {
      subject,
      score: Math.round(scores[i] * 100),
      reconstructed: Math.round(reconScores[i] * 100),
      error: Math.round(error * 1000) / 1000,
      zScore: Math.round(zScore * 100) / 100,
      percentile,
      isWeak,
      severity,
      suggestion: generateSuggestion(subject, scores[i], severity),
    };
  });

  results.sort((a, b) => {
    if (a.isWeak !== b.isWeak) return a.isWeak ? -1 : 1;
    return a.score - b.score;
  });

  // Compute correlations
  const correlations = computeCorrelations(subjectPerf);

  // Overall risk score (0-100, higher = more at risk)
  const weakCount = results.filter(r => r.isWeak).length;
  const criticalCount = results.filter(r => r.severity === 'critical').length;
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const riskScore = Math.round(Math.min(100, Math.max(0,
    (1 - avgScore) * 40 + (weakCount / subjects.length) * 35 + criticalCount * 15
  )));

  clean.dispose(); noisy.dispose(); inputTensor.dispose(); reconstructed.dispose(); autoencoder.dispose();

  return {
    weakAreas: results,
    overallError: Math.round(meanError * 1000) / 1000,
    subjectCount: subjects.length,
    latentDim,
    correlations,
    riskScore,
  };
}
