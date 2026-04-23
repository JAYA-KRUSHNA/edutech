import * as tf from '@tensorflow/tfjs';

/**
 * ═══════════════════════════════════════════════════════════════
 * ANN Student Classifier — Enhanced Multi-Layer Perceptron
 * ═══════════════════════════════════════════════════════════════
 *
 * Architecture:
 *   Input (6 features)
 *   → Dense(32, ReLU) + BatchNorm + Dropout(0.2)
 *   → Dense(16, ReLU) + BatchNorm + Dropout(0.2)
 *   → Dense(8, ReLU)
 *   → Dense(4, Softmax) — [Beginner, Intermediate, Advanced, Expert]
 *
 * Features engineered from quiz attempt data:
 *   1. avgScorePercent   — mean score across all quizzes
 *   2. quizExperience    — sigmoid-normalized quiz count
 *   3. timeEfficiency    — speed of answering (normalized)
 *   4. consistency       — inverse coefficient of variation
 *   5. improvementRate   — slope of scores over time
 *   6. peakPerformance   — best score achieved
 */

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export type StudentLevel = (typeof LEVELS)[number];

export interface ClassificationResult {
  level: StudentLevel;
  confidence: number;
  probabilities: Record<StudentLevel, number>;
  features: {
    avgScore: number;
    quizCount: number;
    timeEfficiency: number;
    consistency: number;
    improvementRate: number;
    peakPerformance: number;
  };
}

/**
 * Extract 6 engineered features from quiz attempt data
 */
export function extractFeatures(
  attempts: Array<{ score: number; total: number; time_taken_s: number | null }>
): ClassificationResult['features'] {
  if (attempts.length === 0) {
    return { avgScore: 0, quizCount: 0, timeEfficiency: 0, consistency: 0, improvementRate: 0, peakPerformance: 0 };
  }

  const scores = attempts.map(a => (a.total > 0 ? a.score / a.total : 0));
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;

  // Sigmoid-normalized quiz experience
  const quizCount = 1 - 1 / (1 + attempts.length * 0.15);

  // Time efficiency (normalized)
  const timesValid = attempts.filter(a => a.time_taken_s != null && a.time_taken_s > 0 && a.total > 0);
  let timeEfficiency = 0.5;
  if (timesValid.length > 0) {
    const avgTimePerQ = timesValid.reduce((s, a) => s + (a.time_taken_s! / a.total), 0) / timesValid.length;
    timeEfficiency = Math.max(0, Math.min(1, 1 - (avgTimePerQ - 20) / 100));
  }

  // Consistency (inverse of coefficient of variation)
  let consistency = 0.5;
  if (scores.length >= 2) {
    const variance = scores.reduce((s, v) => s + (v - avgScore) ** 2, 0) / scores.length;
    const std = Math.sqrt(variance);
    consistency = Math.max(0, Math.min(1, 1 - std * 2.5));
  }

  // Improvement rate (linear regression slope)
  let improvementRate = 0.5;
  if (scores.length >= 3) {
    const n = scores.length;
    const xMean = (n - 1) / 2;
    const yMean = avgScore;
    let numerator = 0, denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (scores[i] - yMean);
      denominator += (i - xMean) ** 2;
    }
    const slope = denominator !== 0 ? numerator / denominator : 0;
    improvementRate = Math.max(0, Math.min(1, 0.5 + slope * 5));
  }

  // Peak performance
  const peakPerformance = Math.max(...scores);

  return { avgScore, quizCount, timeEfficiency, consistency, improvementRate, peakPerformance };
}

/**
 * Build the enhanced ANN classifier
 */
function buildModel(): tf.Sequential {
  const model = tf.sequential();

  model.add(tf.layers.dense({ inputShape: [6], units: 32, activation: 'relu', kernelInitializer: 'heNormal' }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({ units: 16, activation: 'relu', kernelInitializer: 'heNormal' }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));

  model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.005),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

/**
 * Generate rich synthetic training data with 6 features
 */
function generateTrainingData(): { xs: tf.Tensor2D; ys: tf.Tensor2D } {
  const samples: number[][] = [];
  const labels: number[][] = [];
  const rng = (min: number, max: number) => min + Math.random() * (max - min);

  for (let i = 0; i < 80; i++) {
    // Beginner
    samples.push([rng(0, 0.35), rng(0, 0.25), rng(0.1, 0.4), rng(0.1, 0.4), rng(0.3, 0.55), rng(0.05, 0.4)]);
    labels.push([1, 0, 0, 0]);
    // Intermediate
    samples.push([rng(0.3, 0.6), rng(0.2, 0.5), rng(0.3, 0.6), rng(0.3, 0.6), rng(0.4, 0.6), rng(0.35, 0.65)]);
    labels.push([0, 1, 0, 0]);
    // Advanced
    samples.push([rng(0.55, 0.8), rng(0.4, 0.75), rng(0.5, 0.8), rng(0.5, 0.8), rng(0.5, 0.7), rng(0.6, 0.85)]);
    labels.push([0, 0, 1, 0]);
    // Expert
    samples.push([rng(0.75, 1.0), rng(0.6, 1.0), rng(0.7, 1.0), rng(0.65, 1.0), rng(0.5, 0.8), rng(0.8, 1.0)]);
    labels.push([0, 0, 0, 1]);
  }

  return { xs: tf.tensor2d(samples), ys: tf.tensor2d(labels) };
}

/**
 * Classify a student based on their quiz attempts
 */
export async function classifyStudent(
  attempts: Array<{ score: number; total: number; time_taken_s: number | null }>
): Promise<ClassificationResult> {
  const features = extractFeatures(attempts);

  const model = buildModel();
  const { xs, ys } = generateTrainingData();

  await model.fit(xs, ys, { epochs: 40, batchSize: 32, verbose: 0, shuffle: true });

  const input = tf.tensor2d([[
    features.avgScore, features.quizCount, features.timeEfficiency,
    features.consistency, features.improvementRate, features.peakPerformance,
  ]]);
  const prediction = model.predict(input) as tf.Tensor;
  const probs = await prediction.data();

  xs.dispose(); ys.dispose(); input.dispose(); prediction.dispose(); model.dispose();

  let maxIdx = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[maxIdx]) maxIdx = i;
  }

  return {
    level: LEVELS[maxIdx],
    confidence: Math.round(probs[maxIdx] * 100) / 100,
    probabilities: {
      Beginner: Math.round(probs[0] * 100) / 100,
      Intermediate: Math.round(probs[1] * 100) / 100,
      Advanced: Math.round(probs[2] * 100) / 100,
      Expert: Math.round(probs[3] * 100) / 100,
    },
    features,
  };
}
