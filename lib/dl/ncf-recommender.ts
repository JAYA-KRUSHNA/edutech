import * as tf from '@tensorflow/tfjs';

/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Neural Collaborative Filtering (NCF) Recommender
 * ═══════════════════════════════════════════════════════════════
 *
 * Architecture (NeuMF — Neural Matrix Factorization):
 *   GMF Branch: UserEmbed(8) ⊙ ItemEmbed(8) — element-wise product
 *   MLP Branch: [UserEmbed(8) || ItemEmbed(8)]
 *     → Dense(32, ReLU) → Dropout(0.2)
 *     → Dense(16, ReLU) → Dropout(0.1)
 *     → Dense(8, ReLU)
 *   Fusion: [GMF(8) || MLP(8)] → Dense(1, Sigmoid)
 *
 * Combines Generalized Matrix Factorization with a deep MLP
 * for better collaborative filtering accuracy.
 */

export interface QuizRecommendation {
  quiz_id: string;
  title: string;
  subject: string;
  predicted_score: number;
  reason: string;
  confidence: number;
}

export interface ReferenceRecommendation {
  ref_id: string;
  title: string;
  subject: string;
  relevance: number;
  reason: string;
}

export interface RecommendationResult {
  quizzes: QuizRecommendation[];
  references: ReferenceRecommendation[];
  modelInfo: {
    totalStudents: number;
    totalQuizzes: number;
    trainingPairs: number;
    architecture: string;
  };
}

const EMBED_DIM = 8;

/**
 * Build NeuMF model (GMF + MLP fusion)
 */
function buildNeuMFModel(numUsers: number, numItems: number): tf.LayersModel {
  const userInput = tf.input({ shape: [1], name: 'userInput' });
  const itemInput = tf.input({ shape: [1], name: 'itemInput' });

  // GMF Branch — element-wise product
  const userEmbedGMF = tf.layers.embedding({ inputDim: numUsers, outputDim: EMBED_DIM, name: 'userGMF' })
    .apply(userInput) as tf.SymbolicTensor;
  const itemEmbedGMF = tf.layers.embedding({ inputDim: numItems, outputDim: EMBED_DIM, name: 'itemGMF' })
    .apply(itemInput) as tf.SymbolicTensor;
  const userFlatGMF = tf.layers.flatten().apply(userEmbedGMF) as tf.SymbolicTensor;
  const itemFlatGMF = tf.layers.flatten().apply(itemEmbedGMF) as tf.SymbolicTensor;
  const gmfOutput = tf.layers.multiply().apply([userFlatGMF, itemFlatGMF]) as tf.SymbolicTensor;

  // MLP Branch — deep feature interaction
  const userEmbedMLP = tf.layers.embedding({ inputDim: numUsers, outputDim: EMBED_DIM, name: 'userMLP' })
    .apply(userInput) as tf.SymbolicTensor;
  const itemEmbedMLP = tf.layers.embedding({ inputDim: numItems, outputDim: EMBED_DIM, name: 'itemMLP' })
    .apply(itemInput) as tf.SymbolicTensor;
  const userFlatMLP = tf.layers.flatten().apply(userEmbedMLP) as tf.SymbolicTensor;
  const itemFlatMLP = tf.layers.flatten().apply(itemEmbedMLP) as tf.SymbolicTensor;
  const mlpConcat = tf.layers.concatenate().apply([userFlatMLP, itemFlatMLP]) as tf.SymbolicTensor;

  const mlp1 = tf.layers.dense({ units: 32, activation: 'relu' }).apply(mlpConcat) as tf.SymbolicTensor;
  const drop1 = tf.layers.dropout({ rate: 0.2 }).apply(mlp1) as tf.SymbolicTensor;
  const mlp2 = tf.layers.dense({ units: 16, activation: 'relu' }).apply(drop1) as tf.SymbolicTensor;
  const drop2 = tf.layers.dropout({ rate: 0.1 }).apply(mlp2) as tf.SymbolicTensor;
  const mlpOutput = tf.layers.dense({ units: 8, activation: 'relu' }).apply(drop2) as tf.SymbolicTensor;

  // Fusion
  const fusion = tf.layers.concatenate().apply([gmfOutput, mlpOutput]) as tf.SymbolicTensor;
  const output = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(fusion) as tf.SymbolicTensor;

  const model = tf.model({ inputs: [userInput, itemInput], outputs: output });
  model.compile({ optimizer: tf.train.adam(0.003), loss: 'meanSquaredError' });
  return model;
}

/**
 * Generate recommendations using NeuMF
 */
export async function generateRecommendations(
  currentStudentId: string,
  allAttempts: Array<{ student_id: string; quiz_id: string; score: number; total: number }>,
  allQuizzes: Array<{ id: string; title: string; subject: string }>,
  allReferences: Array<{ id: string; title: string; subject: string }>
): Promise<RecommendationResult> {
  const studentIds = [...new Set(allAttempts.map(a => a.student_id))];
  if (!studentIds.includes(currentStudentId)) studentIds.push(currentStudentId);
  const quizIds = allQuizzes.map(q => q.id);

  const studentIdx = new Map(studentIds.map((id, i) => [id, i]));
  const quizIdx = new Map(quizIds.map((id, i) => [id, i]));
  const numUsers = studentIds.length;
  const numItems = quizIds.length;

  const attemptedQuizIds = new Set(
    allAttempts.filter(a => a.student_id === currentStudentId).map(a => a.quiz_id)
  );

  // Subject performance for reference recommendations
  const subjectScores = new Map<string, { total: number; score: number; count: number }>();
  for (const a of allAttempts.filter(at => at.student_id === currentStudentId)) {
    const quiz = allQuizzes.find(q => q.id === a.quiz_id);
    if (!quiz) continue;
    const ex = subjectScores.get(quiz.subject) || { total: 0, score: 0, count: 0 };
    ex.total += a.total; ex.score += a.score; ex.count++;
    subjectScores.set(quiz.subject, ex);
  }

  // Not enough data — content-based fallback
  if (allAttempts.length < 3 || numItems < 2) {
    return {
      quizzes: allQuizzes.filter(q => !attemptedQuizIds.has(q.id)).slice(0, 5).map(q => ({
        quiz_id: q.id, title: q.title, subject: q.subject, predicted_score: 70,
        reason: 'Explore new content', confidence: 0.3,
      })),
      references: allReferences.slice(0, 5).map(r => ({
        ref_id: r.id, title: r.title, subject: r.subject, relevance: 0.7, reason: 'Recommended resource',
      })),
      modelInfo: { totalStudents: numUsers, totalQuizzes: numItems, trainingPairs: 0, architecture: 'NeuMF (GMF+MLP)' },
    };
  }

  // Prepare training data with negative sampling
  const userInputs: number[] = [];
  const itemInputs: number[] = [];
  const scores: number[] = [];

  // Positive samples
  for (const a of allAttempts) {
    const uIdx = studentIdx.get(a.student_id);
    const iIdx = quizIdx.get(a.quiz_id);
    if (uIdx === undefined || iIdx === undefined) continue;
    userInputs.push(uIdx);
    itemInputs.push(iIdx);
    scores.push(a.total > 0 ? a.score / a.total : 0);
  }

  // Negative sampling (uninteracted pairs get score ~0.1)
  const attemptPairs = new Set(allAttempts.map(a => `${a.student_id}:${a.quiz_id}`));
  const maxNegSamples = Math.min(userInputs.length, 50);
  let negCount = 0;
  for (let u = 0; u < Math.min(numUsers, 10); u++) {
    if (negCount >= maxNegSamples) break;
    for (let i = 0; i < numItems; i++) {
      if (negCount >= maxNegSamples) break;
      const pair = `${studentIds[u]}:${quizIds[i]}`;
      if (!attemptPairs.has(pair)) {
        userInputs.push(u);
        itemInputs.push(i);
        scores.push(0.1 + Math.random() * 0.1);
        negCount++;
      }
    }
  }

  if (userInputs.length < 3) {
    return {
      quizzes: [], references: [],
      modelInfo: { totalStudents: numUsers, totalQuizzes: numItems, trainingPairs: 0, architecture: 'NeuMF (GMF+MLP)' },
    };
  }

  // Build and train NeuMF
  const model = buildNeuMFModel(numUsers, numItems);
  const uT = tf.tensor2d(userInputs, [userInputs.length, 1]);
  const iT = tf.tensor2d(itemInputs, [itemInputs.length, 1]);
  const sT = tf.tensor2d(scores, [scores.length, 1]);

  await model.fit([uT, iT], sT, {
    epochs: 30, batchSize: Math.min(32, userInputs.length), verbose: 0, shuffle: true,
  });

  // Predict for unattempted quizzes
  const currentUserIdx = studentIdx.get(currentStudentId) || 0;
  const unattempted = allQuizzes.filter(q => !attemptedQuizIds.has(q.id));
  const quizRecs: QuizRecommendation[] = [];

  for (const quiz of unattempted) {
    const iIdx = quizIdx.get(quiz.id);
    if (iIdx === undefined) continue;
    const pU = tf.tensor2d([[currentUserIdx]]);
    const pI = tf.tensor2d([[iIdx]]);
    const pred = model.predict([pU, pI]) as tf.Tensor;
    const predScore = (await pred.data())[0];
    pU.dispose(); pI.dispose(); pred.dispose();

    quizRecs.push({
      quiz_id: quiz.id, title: quiz.title, subject: quiz.subject,
      predicted_score: Math.round(predScore * 100),
      confidence: Math.min(0.9, 0.4 + allAttempts.length * 0.02),
      reason: predScore > 0.7 ? 'You\'ll likely ace this!' : predScore > 0.4 ? 'Great for growth' : 'Challenge yourself',
    });
  }
  quizRecs.sort((a, b) => b.predicted_score - a.predicted_score);

  // Reference recommendations (subject-based with weakness priority)
  const weakSubjects = new Set<string>();
  for (const [subject, data] of subjectScores) {
    if (data.total > 0 && data.score / data.total < 0.6) weakSubjects.add(subject.toLowerCase());
  }

  const refRecs: ReferenceRecommendation[] = allReferences.map(ref => {
    const subLower = ref.subject.toLowerCase();
    const isWeakMatch = weakSubjects.has(subLower) || [...weakSubjects].some(ws => subLower.includes(ws) || ws.includes(subLower));
    return {
      ref_id: ref.id, title: ref.title, subject: ref.subject,
      relevance: isWeakMatch ? 0.9 : 0.5,
      reason: isWeakMatch ? `Strengthen your ${ref.subject} skills` : 'Broaden your knowledge',
    };
  }).sort((a, b) => b.relevance - a.relevance).slice(0, 5);

  uT.dispose(); iT.dispose(); sT.dispose(); model.dispose();

  return {
    quizzes: quizRecs.slice(0, 5),
    references: refRecs,
    modelInfo: {
      totalStudents: numUsers, totalQuizzes: numItems,
      trainingPairs: userInputs.length,
      architecture: 'NeuMF (GMF ⊙ + MLP(32→16→8))',
    },
  };
}
