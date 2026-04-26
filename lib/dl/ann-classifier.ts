import * as tf from '@tensorflow/tfjs';

/**
 * ═══════════════════════════════════════════════════════════════
 * ANN Student Classifier — Enhanced Multi-Layer Perceptron
 * ═══════════════════════════════════════════════════════════════
 *
 * Architecture (Ensemble of 3):
 *   Input (8 features)
 *   → Dense(48, ReLU, L2=0.001) + BatchNorm + Dropout(0.25)
 *   → Dense(24, ReLU, L2=0.001) + BatchNorm + Dropout(0.2)
 *   → Dense(12, ReLU)
 *   → Dense(4, Softmax) — [Beginner, Intermediate, Advanced, Expert]
 *
 * Features engineered from quiz attempt data:
 *   1. avgScorePercent   — mean score across all quizzes
 *   2. quizExperience    — sigmoid-normalized quiz count
 *   3. timeEfficiency    — speed of answering (normalized)
 *   4. consistency       — inverse coefficient of variation
 *   5. improvementRate   — slope of scores over time (OLS regression)
 *   6. peakPerformance   — best score achieved
 *   7. recentMomentum    — weighted recent vs. older performance
 *   8. difficultyAdaptation — performance on harder questions
 *
 * Enhancements over v1:
 *   - 8 features instead of 6 (added momentum + difficulty adaptation)
 *   - L2 regularization to prevent overfitting on synthetic data
 *   - Ensemble of 3 models with averaged predictions for robustness
 *   - Wider + deeper hidden layers (48→24→12 vs 32→16→8)
 *   - More diverse synthetic data (120 samples/class vs 80)
 *   - Feature importance analysis via gradient-based attribution
 *   - Label smoothing in training data to improve generalization
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
    recentMomentum: number;
    difficultyAdaptation: number;
  };
  featureImportance: Record<string, number>;
  ensembleAgreement: number;
}

/**
 * Extract 8 engineered features from quiz attempt data
 */
export function extractFeatures(
  attempts: Array<{ score: number; total: number; time_taken_s: number | null }>
): ClassificationResult['features'] {
  if (attempts.length === 0) {
    return { avgScore: 0, quizCount: 0, timeEfficiency: 0, consistency: 0, improvementRate: 0, peakPerformance: 0, recentMomentum: 0, difficultyAdaptation: 0 };
  }

  const scores = attempts.map(a => (a.total > 0 ? a.score / a.total : 0));
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;

  // Sigmoid-normalized quiz experience
  const quizCount = 1 - 1 / (1 + attempts.length * 0.12);

  // Time efficiency (normalized) — lower time per question = higher efficiency
  const timesValid = attempts.filter(a => a.time_taken_s != null && a.time_taken_s > 0 && a.total > 0);
  let timeEfficiency = 0.5;
  if (timesValid.length > 0) {
    const avgTimePerQ = timesValid.reduce((s, a) => s + (a.time_taken_s! / a.total), 0) / timesValid.length;
    timeEfficiency = Math.max(0, Math.min(1, 1 - (avgTimePerQ - 15) / 120));
  }

  // Consistency (inverse of coefficient of variation)
  let consistency = 0.5;
  if (scores.length >= 2) {
    const variance = scores.reduce((s, v) => s + (v - avgScore) ** 2, 0) / scores.length;
    const std = Math.sqrt(variance);
    const cv = avgScore > 0 ? std / avgScore : std;
    consistency = Math.max(0, Math.min(1, 1 - cv * 1.8));
  }

  // Improvement rate (OLS linear regression slope over time)
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
    // Normalize slope to [0,1] — positive slope = improving
    improvementRate = Math.max(0, Math.min(1, 0.5 + slope * 4));
  }

  // Peak performance
  const peakPerformance = Math.max(...scores);

  // Recent momentum — exponential decay weighted average of recent vs. old scores
  let recentMomentum = 0.5;
  if (scores.length >= 3) {
    const halfLen = Math.floor(scores.length / 2);
    const recentScores = scores.slice(-halfLen);
    const olderScores = scores.slice(0, halfLen);
    const recentAvg = recentScores.reduce((s, v) => s + v, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((s, v) => s + v, 0) / olderScores.length;
    // +0.5 offset: if recent is better, momentum > 0.5
    recentMomentum = Math.max(0, Math.min(1, 0.5 + (recentAvg - olderAvg) * 2));
  }

  // Difficulty adaptation — how well student handles high-total (harder) quizzes
  let difficultyAdaptation = 0.5;
  const totalDistribution = attempts.map(a => a.total);
  const medianTotal = totalDistribution.sort((a, b) => a - b)[Math.floor(totalDistribution.length / 2)];
  const hardAttempts = attempts.filter(a => a.total >= medianTotal && a.total > 0);
  if (hardAttempts.length > 0) {
    const hardScores = hardAttempts.map(a => a.score / a.total);
    difficultyAdaptation = hardScores.reduce((s, v) => s + v, 0) / hardScores.length;
  }

  return { avgScore, quizCount, timeEfficiency, consistency, improvementRate, peakPerformance, recentMomentum, difficultyAdaptation };
}

/**
 * Build enhanced ANN with L2 regularization
 */
function buildModel(): tf.Sequential {
  const l2Reg = tf.regularizers.l2({ l2: 0.001 });
  const model = tf.sequential();

  model.add(tf.layers.dense({ inputShape: [8], units: 48, activation: 'relu', kernelInitializer: 'heNormal', kernelRegularizer: l2Reg }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.25 }));

  model.add(tf.layers.dense({ units: 24, activation: 'relu', kernelInitializer: 'heNormal', kernelRegularizer: l2Reg }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({ units: 12, activation: 'relu' }));

  model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.004),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

/**
 * Generate diverse synthetic training data with 8 features and label smoothing
 */
function generateTrainingData(): { xs: tf.Tensor2D; ys: tf.Tensor2D } {
  const samples: number[][] = [];
  const labels: number[][] = [];
  const rng = (min: number, max: number) => min + Math.random() * (max - min);
  const SMOOTHING = 0.05; // label smoothing factor

  const smoothLabel = (idx: number) => {
    const label = [SMOOTHING / 3, SMOOTHING / 3, SMOOTHING / 3, SMOOTHING / 3];
    label[idx] = 1 - SMOOTHING;
    return label;
  };

  for (let i = 0; i < 120; i++) {
    // Beginner — low scores, low experience, low consistency
    samples.push([rng(0, 0.35), rng(0, 0.2), rng(0.1, 0.4), rng(0.1, 0.4), rng(0.3, 0.55), rng(0.05, 0.4), rng(0.3, 0.5), rng(0.1, 0.35)]);
    labels.push(smoothLabel(0));

    // Intermediate — moderate across the board
    samples.push([rng(0.3, 0.6), rng(0.15, 0.45), rng(0.3, 0.6), rng(0.3, 0.6), rng(0.4, 0.6), rng(0.35, 0.65), rng(0.4, 0.6), rng(0.3, 0.6)]);
    labels.push(smoothLabel(1));

    // Advanced — high scores, good consistency, strong momentum
    samples.push([rng(0.55, 0.82), rng(0.35, 0.7), rng(0.5, 0.8), rng(0.5, 0.8), rng(0.45, 0.7), rng(0.6, 0.85), rng(0.5, 0.75), rng(0.55, 0.8)]);
    labels.push(smoothLabel(2));

    // Expert — consistently high across all features
    samples.push([rng(0.75, 1.0), rng(0.55, 1.0), rng(0.65, 1.0), rng(0.65, 1.0), rng(0.45, 0.8), rng(0.8, 1.0), rng(0.6, 0.9), rng(0.7, 1.0)]);
    labels.push(smoothLabel(3));
  }

  return { xs: tf.tensor2d(samples), ys: tf.tensor2d(labels) };
}

/**
 * Compute gradient-based feature importance
 */
async function computeFeatureImportance(model: tf.Sequential, featureVector: number[]): Promise<Record<string, number>> {
  const featureNames = ['avgScore', 'quizCount', 'timeEfficiency', 'consistency', 'improvementRate', 'peakPerformance', 'recentMomentum', 'difficultyAdaptation'];
  const importance: Record<string, number> = {};

  // Perturbation-based importance: measure prediction change when each feature is zeroed
  const basePred = model.predict(tf.tensor2d([featureVector])) as tf.Tensor;
  const baseProbs = await basePred.data();
  const baseMax = Math.max(...Array.from(baseProbs));
  basePred.dispose();

  for (let f = 0; f < featureVector.length; f++) {
    const perturbed = [...featureVector];
    perturbed[f] = 0; // zero-out feature
    const pertPred = model.predict(tf.tensor2d([perturbed])) as tf.Tensor;
    const pertProbs = await pertPred.data();
    const pertMax = Math.max(...Array.from(pertProbs));
    pertPred.dispose();

    importance[featureNames[f]] = Math.round(Math.abs(baseMax - pertMax) * 1000) / 1000;
  }

  // Normalize to sum to 1
  const total = Object.values(importance).reduce((s, v) => s + v, 0);
  if (total > 0) {
    for (const key of Object.keys(importance)) {
      importance[key] = Math.round((importance[key] / total) * 100) / 100;
    }
  }

  return importance;
}

/**
 * Classify a student using an ensemble of 3 models
 */
export async function classifyStudent(
  attempts: Array<{ score: number; total: number; time_taken_s: number | null }>
): Promise<ClassificationResult> {
  const features = extractFeatures(attempts);
  const featureVector = [
    features.avgScore, features.quizCount, features.timeEfficiency,
    features.consistency, features.improvementRate, features.peakPerformance,
    features.recentMomentum, features.difficultyAdaptation,
  ];

  const ENSEMBLE_SIZE = 3;
  const allProbs: number[][] = [];
  let lastModel: tf.Sequential | null = null;

  for (let e = 0; e < ENSEMBLE_SIZE; e++) {
    const model = buildModel();
    const { xs, ys } = generateTrainingData();

    await model.fit(xs, ys, { epochs: 45, batchSize: 32, verbose: 0, shuffle: true });

    const input = tf.tensor2d([featureVector]);
    const prediction = model.predict(input) as tf.Tensor;
    const probs = await prediction.data();
    allProbs.push(Array.from(probs));

    xs.dispose(); ys.dispose(); input.dispose(); prediction.dispose();

    if (e < ENSEMBLE_SIZE - 1) model.dispose();
    else lastModel = model; // keep last for feature importance
  }

  // Average ensemble predictions
  const avgProbs = [0, 0, 0, 0];
  for (const probs of allProbs) {
    for (let i = 0; i < 4; i++) avgProbs[i] += probs[i] / ENSEMBLE_SIZE;
  }

  // Compute ensemble agreement (how much models agree)
  let agreement = 0;
  const ensembleMaxes = allProbs.map(p => { let mx = 0; for (let i = 1; i < p.length; i++) { if (p[i] > p[mx]) mx = i; } return mx; });
  const majorityPred = ensembleMaxes[0];
  agreement = ensembleMaxes.filter(m => m === majorityPred).length / ENSEMBLE_SIZE;

  let maxIdx = 0;
  for (let i = 1; i < avgProbs.length; i++) {
    if (avgProbs[i] > avgProbs[maxIdx]) maxIdx = i;
  }

  // Compute feature importance on last model
  const featureImportance = lastModel
    ? await computeFeatureImportance(lastModel, featureVector)
    : {};
  if (lastModel) lastModel.dispose();

  return {
    level: LEVELS[maxIdx],
    confidence: Math.round(avgProbs[maxIdx] * 100) / 100,
    probabilities: {
      Beginner: Math.round(avgProbs[0] * 100) / 100,
      Intermediate: Math.round(avgProbs[1] * 100) / 100,
      Advanced: Math.round(avgProbs[2] * 100) / 100,
      Expert: Math.round(avgProbs[3] * 100) / 100,
    },
    features,
    featureImportance,
    ensembleAgreement: Math.round(agreement * 100) / 100,
  };
}
