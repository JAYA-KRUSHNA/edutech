import * as tf from '@tensorflow/tfjs';

/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced NLP Text Analyzer v2
 * ═══════════════════════════════════════════════════════════════
 *
 * Architecture:
 *   Bag-of-Words Feature Extraction (8 topic dimensions)
 *   → Dense(48, ReLU, L2) + BatchNorm
 *   → Dense(24, ReLU) + Dropout(0.2)
 *   → Dense(8, Softmax) — topic classification
 *
 * Enhancements over v1:
 *   - Wider network (48→24 vs 32→16) with L2 regularization
 *   - Tri-gram support for 3-word compound terms
 *   - Extractive summarization (top 3 key sentences)
 *   - Topic coherence scoring (how focused is the text)
 *   - Named entity recognition for DL terms
 *   - Expanded keyword dictionaries with sub-topic grouping
 *   - Positional weighting (keywords in first paragraph matter more)
 *   - Vocabulary richness metrics
 *   - More training samples per topic (45 vs 30)
 */

const TOPICS = [
  'Neural Networks',
  'Computer Vision',
  'Natural Language Processing',
  'Reinforcement Learning',
  'Mathematics',
  'Data Science',
  'Programming',
  'General',
] as const;

export type Topic = (typeof TOPICS)[number];

// Enhanced keyword dictionaries
const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  'Neural Networks': [
    'neural', 'network', 'neuron', 'perceptron', 'backpropagation', 'gradient',
    'descent', 'activation', 'relu', 'sigmoid', 'tanh', 'weights', 'bias',
    'layer', 'deep', 'learning', 'training', 'epoch', 'batch', 'dropout',
    'overfitting', 'regularization', 'loss', 'optimizer', 'adam', 'sgd',
    'feedforward', 'ann', 'mlp', 'dense', 'softmax', 'vanishing',
    'exploding', 'initialization', 'xavier', 'glorot', 'batchnorm',
    'residual', 'skip', 'connection', 'bottleneck', 'autograd',
    'hyperparameter', 'tuning', 'validation', 'underfitting',
  ],
  'Computer Vision': [
    'cnn', 'convolutional', 'convolution', 'pooling', 'maxpooling',
    'image', 'pixel', 'filter', 'kernel', 'feature', 'stride',
    'padding', 'resnet', 'vgg', 'inception', 'detection', 'segmentation',
    'classification', 'recognition', 'object', 'yolo', 'opencv', 'vision',
    'augmentation', 'rotation', 'flipping', 'crop', 'gan', 'unet',
    'deconvolution', 'upsampling', 'anchor', 'bounding',
    'mobilenet', 'efficientnet', 'fpn', 'roi', 'mask', 'semantic',
    'instance', 'panoptic', 'backbone', 'neck',
  ],
  'Natural Language Processing': [
    'nlp', 'language', 'text', 'word', 'embedding', 'word2vec', 'glove',
    'transformer', 'attention', 'bert', 'gpt', 'rnn', 'lstm', 'gru',
    'sequence', 'sentiment', 'tokenization', 'vocabulary', 'corpus',
    'translation', 'generation', 'chatbot', 'speech', 'parsing',
    'encoder', 'decoder', 'positional', 'self-attention', 'masked',
    'bi-directional', 'fine-tuning', 'pre-training',
    'ner', 'entity', 'relation', 'dependency', 'constituency',
    'beam', 'search', 'bleu', 'rouge', 'perplexity', 'subword',
  ],
  'Reinforcement Learning': [
    'reinforcement', 'reward', 'policy', 'agent', 'environment', 'action',
    'state', 'q-learning', 'exploration', 'exploitation', 'markov',
    'mdp', 'bellman', 'temporal', 'difference', 'monte', 'carlo',
    'epsilon', 'greedy', 'dqn', 'ppo', 'sarsa', 'actor', 'critic',
    'a2c', 'a3c', 'advantage', 'trajectory', 'experience', 'replay',
    'curiosity', 'intrinsic', 'extrinsic', 'multi-agent', 'gymnasium',
  ],
  'Mathematics': [
    'matrix', 'vector', 'linear', 'algebra', 'calculus', 'derivative',
    'integral', 'probability', 'statistics', 'distribution', 'gaussian',
    'bayes', 'eigenvalue', 'eigenvector', 'norm', 'optimization',
    'convex', 'equation', 'function', 'theorem', 'proof', 'hessian',
    'jacobian', 'determinant', 'singular', 'decomposition', 'svd',
    'gradient', 'divergence', 'laplacian', 'fourier', 'transform',
    'stochastic', 'entropy', 'kl-divergence', 'cross-entropy',
  ],
  'Data Science': [
    'data', 'dataset', 'pandas', 'numpy', 'matplotlib', 'visualization',
    'preprocessing', 'normalization', 'feature', 'engineering', 'eda',
    'sklearn', 'regression', 'clustering', 'pca',
    'dimensionality', 'reduction', 'cross-validation', 'metrics',
    'precision', 'recall', 'f1', 'roc', 'auc', 'confusion',
    'pipeline', 'imputation', 'outlier', 'scaling', 'encoding',
    'categorical', 'numerical', 'correlation', 'hypothesis',
  ],
  'Programming': [
    'python', 'code', 'function', 'class', 'algorithm', 'implementation',
    'library', 'framework', 'tensorflow', 'pytorch', 'keras', 'api',
    'debug', 'error', 'syntax', 'variable', 'loop', 'array', 'list',
    'dictionary', 'module', 'import', 'pip', 'conda', 'jupyter',
    'notebook', 'gpu', 'cuda', 'parallel', 'distributed',
    'docker', 'deployment', 'serving', 'inference', 'onnx', 'optimization',
  ],
  'General': [
    'learn', 'study', 'understand', 'concept', 'theory', 'practice',
    'example', 'exercise', 'quiz', 'test', 'exam', 'course', 'tutorial',
    'introduction', 'beginner', 'advanced', 'intermediate', 'reference',
    'research', 'paper', 'survey', 'review', 'benchmark',
  ],
};

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and',
  'or', 'if', 'while', 'about', 'up', 'its', 'it', 'this', 'that',
  'these', 'those', 'what', 'which', 'who', 'whom', 'i', 'me', 'my',
  'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them', 'his', 'her',
  'also', 'like', 'used', 'using', 'use', 'one', 'two', 'new', 'get',
  'make', 'made', 'way', 'well', 'many', 'much', 'even', 'back',
]);

// Bi-grams and tri-grams
const NGRAMS: Record<string, string> = {
  'neural network': 'Neural Networks',
  'deep learning': 'Neural Networks',
  'machine learning': 'Data Science',
  'computer vision': 'Computer Vision',
  'natural language': 'Natural Language Processing',
  'reinforcement learning': 'Reinforcement Learning',
  'gradient descent': 'Neural Networks',
  'transfer learning': 'Neural Networks',
  'attention mechanism': 'Natural Language Processing',
  'object detection': 'Computer Vision',
  'sentiment analysis': 'Natural Language Processing',
  'feature extraction': 'Data Science',
  'batch normalization': 'Neural Networks',
  'data augmentation': 'Computer Vision',
  'linear algebra': 'Mathematics',
  'loss function': 'Neural Networks',
  'activation function': 'Neural Networks',
  'recurrent neural': 'Natural Language Processing',
  'convolutional neural': 'Computer Vision',
  'generative adversarial': 'Computer Vision',
  'collaborative filtering': 'Data Science',
  'q learning': 'Reinforcement Learning',
  // Tri-grams
  'natural language processing': 'Natural Language Processing',
  'convolutional neural network': 'Computer Vision',
  'recurrent neural network': 'Natural Language Processing',
  'generative adversarial network': 'Computer Vision',
  'long short term': 'Natural Language Processing',
  'stochastic gradient descent': 'Neural Networks',
  'principal component analysis': 'Data Science',
  'support vector machine': 'Data Science',
  'monte carlo tree': 'Reinforcement Learning',
  'deep reinforcement learning': 'Reinforcement Learning',
  'graph neural network': 'Neural Networks',
  'variational auto encoder': 'Neural Networks',
};

// DL named entities
const DL_ENTITIES: Record<string, string> = {
  'tensorflow': 'Framework', 'pytorch': 'Framework', 'keras': 'Framework',
  'scikit-learn': 'Framework', 'sklearn': 'Framework',
  'resnet': 'Architecture', 'vgg': 'Architecture', 'inception': 'Architecture',
  'bert': 'Model', 'gpt': 'Model', 'yolo': 'Model', 'unet': 'Architecture',
  'mobilenet': 'Architecture', 'efficientnet': 'Architecture',
  'adam': 'Optimizer', 'sgd': 'Optimizer', 'rmsprop': 'Optimizer',
  'relu': 'Activation', 'sigmoid': 'Activation', 'tanh': 'Activation', 'softmax': 'Activation',
  'dropout': 'Technique', 'batchnorm': 'Technique', 'augmentation': 'Technique',
  'backpropagation': 'Algorithm', 'gradient descent': 'Algorithm',
};

/**
 * Plain-English explanations for technical terms.
 * Used to "decode" difficult text into simple language.
 */
const TERM_SIMPLIFICATIONS: Record<string, string> = {
  // Neural Network fundamentals
  'backpropagation': 'a method the AI uses to learn from its mistakes by adjusting itself backwards',
  'gradient descent': 'a step-by-step process to find the best solution, like walking downhill to reach the lowest point',
  'gradient': 'a measurement of how much a small change in one thing affects another — like a slope',
  'loss function': 'a score that tells the AI how wrong its answers are — lower is better',
  'activation function': 'a filter that decides whether a neuron should "fire" or stay quiet',
  'relu': 'a simple filter: if the number is negative, make it zero; otherwise keep it',
  'sigmoid': 'a function that squishes any number into a value between 0 and 1, like a probability',
  'tanh': 'a function that squishes numbers between -1 and 1',
  'softmax': 'converts a list of numbers into probabilities that add up to 100%',
  'epoch': 'one complete pass through all the training data — like re-reading a textbook once',
  'batch': 'a small group of examples the AI learns from at a time, instead of all at once',
  'overfitting': 'when the AI memorizes the training data instead of truly learning — like memorizing answers without understanding',
  'underfitting': 'when the AI is too simple to learn the patterns — like trying to draw a curve with a straight line',
  'regularization': 'a technique to prevent the AI from memorizing by adding a penalty for complexity',
  'dropout': 'randomly turning off some neurons during training so the AI doesn\'t rely on just a few',
  'weights': 'numbers the AI adjusts during learning — they control how important each input is',
  'bias': 'an extra number added to shift the output, like adjusting a baseline',
  'neuron': 'a tiny processing unit that takes inputs, does math, and produces an output',
  'perceptron': 'the simplest type of neural network — just one neuron',
  'dense': 'a layer where every neuron connects to every neuron in the next layer',
  'feedforward': 'data flows in one direction only — from input to output, no loops',
  'hidden layer': 'layers between input and output where the AI does its "thinking"',
  'deep learning': 'AI that uses many layers of neurons stacked together to learn complex patterns',
  'neural network': 'a computer system inspired by the human brain, made of connected artificial neurons',
  'hyperparameter': 'settings you choose before training (like learning speed), not learned by the AI itself',
  'learning rate': 'how big of a step the AI takes when adjusting — too big and it overshoots, too small and it\'s slow',
  'batch normalization': 'a trick to keep values in each layer stable, making training faster and smoother',
  'vanishing gradient': 'when the learning signal becomes too tiny to be useful in deep networks',
  'exploding gradient': 'when the learning signal becomes way too large and makes training unstable',
  'transfer learning': 'using knowledge from a pre-trained AI and adapting it to a new task',
  'fine-tuning': 'slightly adjusting a pre-trained model to work better on your specific data',
  
  // CNN / Computer Vision
  'convolution': 'sliding a small filter across an image to detect patterns like edges or textures',
  'convolutional': 'using sliding filters to scan images for patterns',
  'pooling': 'shrinking an image by keeping only the most important values in each region',
  'stride': 'how many pixels the filter moves each step — larger stride = faster but less detailed',
  'padding': 'adding extra pixels around the border of an image so the filter can cover the edges',
  'feature map': 'the result after applying a filter — highlights where a pattern was found',
  'data augmentation': 'creating more training images by flipping, rotating, or cropping the originals',
  'object detection': 'finding and labeling objects in an image with boxes around them',
  'segmentation': 'coloring every pixel in an image to show which object it belongs to',
  
  // NLP
  'embedding': 'converting words into lists of numbers so the AI can understand their meaning',
  'tokenization': 'splitting text into individual words or pieces for the AI to process',
  'attention': 'letting the AI focus on the most important parts of the input, like highlighting key words',
  'self-attention': 'each word looks at all other words in the sentence to understand context',
  'transformer': 'a modern AI architecture that uses attention to process all words at once, not one by one',
  'sentiment analysis': 'figuring out if a text is positive, negative, or neutral in tone',
  
  // RNN / LSTM
  'recurrent': 'processing data step by step and remembering what came before, like reading a story word by word',
  'lstm': 'a smarter version of a recurrent network that can remember important things for a long time',
  'gru': 'a simpler version of LSTM that still remembers past information',
  'sequence': 'data that has an order — like words in a sentence or stock prices over time',
  
  // RL
  'reinforcement learning': 'AI learns by trial and error, getting rewards for good actions and penalties for bad ones',
  'reward': 'a signal telling the AI how good its action was — like giving a dog a treat',
  'policy': 'the AI\'s strategy for choosing actions — its decision-making rulebook',
  'exploration': 'trying random new actions to discover what works',
  'exploitation': 'sticking with what the AI already knows works well',
  'epsilon greedy': 'sometimes explore randomly, mostly use the best known action',
  
  // Math
  'matrix': 'a grid of numbers organized in rows and columns',
  'vector': 'a list of numbers, like coordinates in space',
  'eigenvalue': 'a special number that tells you how much a transformation stretches or shrinks',
  'optimization': 'finding the best possible solution by adjusting inputs',
  'convex': 'a shape or problem where any path downhill leads to the single best answer',
  'cross-entropy': 'a way to measure how different two probability distributions are',
  'distribution': 'a description of how likely different outcomes are — like a bell curve',
  
  // Data Science
  'normalization': 'rescaling data so all values fit in a standard range (like 0 to 1)',
  'feature engineering': 'creating new useful data columns from existing data to help the AI learn better',
  'dimensionality reduction': 'simplifying data by keeping only the most important parts',
  'pca': 'a method to reduce data dimensions by finding the directions with the most variation',
  'clustering': 'grouping similar data points together without being told the groups in advance',
  'regression': 'predicting a number (like price or temperature) from input data',
  'classification': 'sorting data into categories (like spam vs. not spam)',
  'precision': 'of all the things the AI said were positive, how many actually were',
  'recall': 'of all the actual positives, how many did the AI find',
  'f1': 'a balanced score combining precision and recall into one number',
  
  // Frameworks & Models
  'tensorflow': 'Google\'s open-source library for building and training AI models',
  'pytorch': 'Facebook\'s popular library for building AI, known for being easy to experiment with',
  'keras': 'a user-friendly wrapper that makes building neural networks simpler',
  'bert': 'Google\'s language AI that reads text in both directions to understand context',
  'gpt': 'OpenAI\'s text generation model that predicts the next word to write human-like text',
  'yolo': 'a fast object detection AI — "You Only Look Once" — processes images in one pass',
  'resnet': 'a very deep image AI that uses shortcut connections to avoid vanishing gradients',
  'gan': 'two AIs competing: one creates fake data, the other tries to detect fakes',
  'autoencoder': 'an AI that compresses data into a small code, then reconstructs it — used to find anomalies',

  // Training & Optimization
  'convergence': 'when the AI stops improving because it has found a good-enough answer',
  'learning rate decay': 'gradually making the AI\'s learning steps smaller over time so it fine-tunes more carefully',
  'momentum': 'speeding up learning by remembering the direction of previous updates — like a rolling ball',
  'weight initialization': 'choosing smart starting values for the AI\'s numbers so training begins well',
  'early stopping': 'stopping training before the AI starts memorizing instead of learning',
  'validation set': 'a separate chunk of data used to check if the AI is actually learning, not just memorizing',
  'test set': 'data the AI has never seen, used to measure its real-world performance',
  'training set': 'the data the AI learns from — like a textbook for studying',
  'mini-batch': 'a small random sample of training data used in each learning step',
  'stochastic': 'random — in AI, it means using random samples instead of all data at once',
  'optimizer': 'the algorithm that adjusts the AI\'s weights to reduce errors — like a tuning knob',
  'adam': 'a popular optimizer that adapts its learning speed for each weight individually',
  'sgd': 'Stochastic Gradient Descent — the simplest optimizer that updates weights using random samples',
  'rmsprop': 'an optimizer that adjusts speed based on how much each weight has been changing recently',
  'loss': 'a number measuring how wrong the AI\'s predictions are — the goal is to make it as small as possible',
  'cost function': 'another name for loss function — measures the total error across all training examples',
  'mean squared error': 'average of squared differences between predicted and actual values — penalizes big mistakes',
  'binary cross entropy': 'loss function for yes/no decisions — measures how confident and correct predictions are',
  'categorical': 'relating to categories or classes (like cat, dog, bird) rather than numbers',
  'one-hot encoding': 'representing categories as lists of 0s and 1s — only one position is "hot" (1)',
  'label': 'the correct answer for a training example — what the AI is trying to predict',
  'ground truth': 'the actual correct answer that we compare the AI\'s prediction against',
  'inference': 'using a trained AI to make predictions on new data — the "using" phase after training',
  'parameter': 'a value inside the AI that gets adjusted during training (like weights and biases)',
  'gradient clipping': 'capping how large the learning updates can be to prevent training from going haywire',
  'warmup': 'starting with a very small learning rate and gradually increasing it at the beginning of training',
  'curriculum learning': 'training the AI on easy examples first, then gradually harder ones — like a school curriculum',
  'teacher forcing': 'during training, giving the AI the correct previous answer instead of its own prediction',

  // Architecture Components
  'skip connection': 'a shortcut that lets data bypass layers, helping very deep networks learn better',
  'residual': 'adding the original input back to the output of a layer — helps information flow through deep networks',
  'bottleneck': 'a narrow layer that forces the network to compress information into fewer numbers',
  'attention head': 'one of several parallel attention mechanisms that each focus on different relationships',
  'multi-head attention': 'running multiple attention mechanisms in parallel so the AI can focus on different things simultaneously',
  'positional encoding': 'adding information about word order to embeddings since transformers don\'t naturally know position',
  'encoder': 'the part of a model that reads and compresses input into a meaningful representation',
  'decoder': 'the part that takes a compressed representation and generates the output',
  'latent space': 'a compressed hidden representation where the AI stores the essence of the data',
  'feature': 'a measurable property of the data — like color, size, or word frequency',
  'input layer': 'the first layer that receives the raw data',
  'output layer': 'the last layer that produces the final prediction',
  'flatten': 'reshaping multi-dimensional data into a single long list of numbers',
  'concatenate': 'joining two or more lists of numbers end-to-end into one longer list',
  'kernel': 'a small grid of numbers used as a filter to detect patterns in data',
  'filter': 'a pattern detector that slides over data looking for specific features',
  'upsampling': 'making data larger — like increasing an image\'s resolution',
  'downsampling': 'making data smaller — like shrinking an image to save memory',
  'global average pooling': 'averaging all values in each feature map into a single number',
  'depthwise separable': 'a lightweight convolution that processes each channel separately then combines — much faster',

  // Generative AI
  'diffusion model': 'an AI that learns to create images by slowly removing noise from random static',
  'stable diffusion': 'a popular image-generation AI that creates pictures from text descriptions',
  'variational autoencoder': 'an autoencoder that learns a smooth compressed space, allowing it to generate new data',
  'latent diffusion': 'running the diffusion process in compressed space instead of pixel space — much more efficient',
  'prompt': 'the text instruction you give to an AI to tell it what to generate',
  'hallucination': 'when an AI confidently generates information that is completely made up',
  'temperature': 'a setting that controls how creative vs. predictable the AI\'s output is',
  'top-k sampling': 'only choosing from the k most likely next words when generating text',
  'beam search': 'exploring multiple possible outputs simultaneously to find the best overall sequence',
  'generative': 'AI that creates new content (text, images, music) rather than just analyzing existing data',
  'discriminator': 'the part of a GAN that judges whether data is real or fake',
  'generator': 'the part of a GAN that creates new fake data trying to fool the discriminator',
  'mode collapse': 'when a GAN gets stuck producing only one type of output instead of diverse results',

  // NLP Extended
  'word2vec': 'an algorithm that converts words into number vectors where similar words are near each other',
  'glove': 'Global Vectors — word embeddings trained on how often words appear together across text',
  'bag of words': 'representing text by counting how many times each word appears, ignoring word order',
  'tf-idf': 'a score measuring how important a word is — common in one document but rare overall',
  'cosine similarity': 'measuring how similar two vectors are by the angle between them — 1 means identical direction',
  'named entity recognition': 'finding and labeling proper nouns in text — like person names, places, organizations',
  'part of speech': 'classifying words as nouns, verbs, adjectives, etc.',
  'lemmatization': 'reducing words to their base form — "running" becomes "run"',
  'stemming': 'chopping off word endings to find the root — cruder than lemmatization',
  'corpus': 'a large collection of text used for training language models',
  'vocabulary': 'the complete set of unique words or tokens the AI knows about',
  'seq2seq': 'sequence-to-sequence — converting one sequence into another, like translating a sentence',
  'masked language model': 'training by hiding random words and making the AI predict them — like a fill-in-the-blank test',
  'context window': 'how many words/tokens the AI can "see" at once when processing text',
  'zero-shot': 'the AI performing a task it was never explicitly trained for',
  'few-shot': 'the AI learning from just a handful of examples instead of thousands',
  'chain of thought': 'prompting the AI to explain its reasoning step by step for better answers',

  // Computer Vision Extended
  'bounding box': 'a rectangle drawn around a detected object in an image',
  'anchor box': 'pre-defined box shapes that help the AI look for objects of different sizes',
  'non-maximum suppression': 'removing duplicate detections by keeping only the most confident bounding box',
  'intersection over union': 'measuring how much two boxes overlap — used to evaluate detection accuracy',
  'image classification': 'assigning a single label to an entire image (like "cat" or "dog")',
  'semantic segmentation': 'labeling every pixel in an image with what object or region it belongs to',
  'instance segmentation': 'like semantic segmentation but also distinguishing between individual objects',
  'feature pyramid': 'detecting objects at multiple scales by combining features from different layers',
  'receptive field': 'how much of the original image a single neuron can "see" after multiple layers',
  'pretrained model': 'an AI already trained on a large dataset that you can reuse as a starting point',
  'backbone': 'the main feature extraction network in a detection or segmentation model',

  // Reinforcement Learning Extended
  'q-value': 'a number estimating how good it is to take a specific action in a specific situation',
  'state space': 'all possible situations the AI agent could find itself in',
  'action space': 'all possible actions the AI agent can take',
  'discount factor': 'how much the AI values future rewards vs. immediate ones — like patience',
  'experience replay': 'storing past experiences and randomly replaying them to learn more efficiently',
  'on-policy': 'learning from actions the AI is currently taking',
  'off-policy': 'learning from past actions or other agents\' actions',
  'actor-critic': 'two networks working together — one chooses actions, the other evaluates them',
  'environment': 'the world the AI agent interacts with — provides states and rewards',
  'episode': 'one complete round of the agent interacting with the environment from start to finish',
  'trajectory': 'the sequence of states, actions, and rewards in one episode',

  // Math & Statistics Extended
  'tensor': 'a multi-dimensional array of numbers — the basic data container in deep learning',
  'scalar': 'a single number (as opposed to a vector or matrix)',
  'dot product': 'multiplying two vectors element-by-element and adding the results — measures alignment',
  'transpose': 'flipping a matrix so rows become columns and vice versa',
  'determinant': 'a single number describing certain properties of a matrix — like its "volume factor"',
  'inverse': 'the matrix equivalent of division — multiplying by it gives the identity matrix',
  'derivative': 'the rate of change — how fast something changes when you nudge the input',
  'partial derivative': 'the rate of change with respect to one variable while keeping others fixed',
  'chain rule': 'a math rule for computing derivatives of nested functions — the backbone of backpropagation',
  'jacobian': 'a matrix of all partial derivatives — shows how each output changes with each input',
  'hessian': 'a matrix of second derivatives — describes the curvature of the loss landscape',
  'convex optimization': 'finding the best answer when the problem has no tricky local traps — just one valley',
  'local minimum': 'a low point that isn\'t the absolute lowest — the AI might get stuck here',
  'global minimum': 'the absolute best solution — the deepest valley in the entire landscape',
  'saddle point': 'a point that looks like a minimum in some directions but a maximum in others',
  'logarithm': 'the opposite of exponentiation — "how many times do I multiply to get this number?"',
  'exponential': 'growing faster and faster — each step multiplies by a constant factor',
  'probability': 'a number between 0 and 1 representing how likely something is to happen',
  'bayes theorem': 'a formula for updating beliefs based on new evidence — foundational for AI reasoning',
  'prior': 'what you believe before seeing any evidence',
  'posterior': 'your updated belief after considering the evidence',
  'likelihood': 'how probable the observed data is, given a particular hypothesis',
  'variance': 'how spread out data points are from the average — high variance means lots of scatter',
  'standard deviation': 'the average distance of data points from the mean — the square root of variance',
  'covariance': 'how two variables change together — positive means they increase together',
  'correlation': 'a standardized measure (-1 to 1) of how strongly two variables are related',
  'hypothesis testing': 'using statistics to decide whether an observed pattern is real or just random chance',
  'p-value': 'the probability of seeing results this extreme if there were actually no effect',
  'confidence interval': 'a range of values that likely contains the true answer, with a stated certainty level',

  // Hardware & Deployment
  'gpu': 'Graphics Processing Unit — a chip designed for parallel math, perfect for AI training',
  'tpu': 'Tensor Processing Unit — Google\'s custom chip designed specifically for AI workloads',
  'cuda': 'NVIDIA\'s toolkit that lets programmers use GPU power for general computing tasks',
  'batch size': 'how many examples the AI processes at once — larger = faster but needs more memory',
  'model compression': 'making a trained AI smaller and faster without losing much accuracy',
  'quantization': 'reducing the precision of numbers (e.g., 32-bit to 8-bit) to make models smaller and faster',
  'pruning': 'removing unimportant weights from a network to make it lighter — like trimming a bush',
  'distillation': 'training a small "student" model to mimic a large "teacher" model',
  'edge computing': 'running AI directly on devices (phones, sensors) instead of sending data to the cloud',
  'onnx': 'a universal format for sharing AI models between different frameworks',
  'containerization': 'packaging software with all its dependencies so it runs the same everywhere',
  'api': 'Application Programming Interface — a way for different software to talk to each other',
  'endpoint': 'a specific URL where an API listens for requests and sends back responses',
  'latency': 'the delay between sending a request and getting a response — lower is better',
  'throughput': 'how many requests or predictions the system can handle per second',

  // Data & Preprocessing
  'data pipeline': 'an automated series of steps that collects, cleans, and prepares data for the AI',
  'etl': 'Extract, Transform, Load — the three steps of moving data from source to destination',
  'missing values': 'gaps in the data where information wasn\'t recorded',
  'imputation': 'filling in missing data values with reasonable estimates',
  'outlier': 'a data point that is very different from the rest — could be an error or something interesting',
  'class imbalance': 'when one category has way more examples than others, making the AI biased',
  'oversampling': 'creating more copies of rare examples to balance the dataset',
  'undersampling': 'removing some common examples to balance the dataset',
  'train test split': 'dividing data into a learning portion and a testing portion',
  'cross-validation': 'testing the AI multiple times with different data splits to get a reliable score',
  'k-fold': 'splitting data into k parts, training on k-1 parts and testing on 1, rotating through all parts',
  'stratified': 'making sure each split has the same proportion of each class as the original data',
  'batch generator': 'a tool that feeds data to the AI in small chunks to save memory',
  'data loader': 'software that efficiently reads and prepares data batches during training',
  'shuffling': 'randomly reordering data before each training pass to prevent the AI from learning order patterns',
  'augmentation': 'artificially expanding training data by applying transformations (flip, rotate, noise)',
  'synthetic data': 'artificially generated data that mimics real data — useful when real data is scarce',
};

export interface SimplifiedTerm {
  term: string;
  explanation: string;
  context: string; // the sentence where it was found
}

export interface AnalysisResult {
  topics: Array<{ topic: Topic; confidence: number }>;
  keywords: Array<{ word: string; score: number; topic?: string }>;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  difficultyScore: number;
  wordCount: number;
  bigramsFound: string[];
  readabilityMetrics: {
    avgWordLength: number;
    avgSentenceLength: number;
    techDensity: number;
    vocabularyRichness: number;
  };
  summary: string[];
  entities: Array<{ name: string; type: string }>;
  topicCoherence: number;
  simplifiedTerms: SimplifiedTerm[];
  simplifiedText: string;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function detectNgrams(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];
  // Check longer n-grams first
  const sorted = Object.keys(NGRAMS).sort((a, b) => b.length - a.length);
  for (const ng of sorted) {
    if (lowerText.includes(ng)) found.push(ng);
  }
  return [...new Set(found)];
}

function detectEntities(text: string): Array<{ name: string; type: string }> {
  const lowerText = text.toLowerCase();
  const found: Array<{ name: string; type: string }> = [];
  for (const [entity, type] of Object.entries(DL_ENTITIES)) {
    if (lowerText.includes(entity)) {
      found.push({ name: entity, type });
    }
  }
  return found;
}

function extractTopicFeatures(tokens: string[], ngrams: string[]): number[] {
  const features: number[] = [];
  const totalTokens = tokens.length || 1;

  // Positional weights: tokens in first 30% of text get 1.3x boost
  const firstThird = Math.ceil(totalTokens * 0.3);

  for (const topic of TOPICS) {
    const keywords = TOPIC_KEYWORDS[topic];
    let matchScore = 0;

    for (let idx = 0; idx < tokens.length; idx++) {
      const token = tokens[idx];
      if (keywords.some(kw => token === kw || (token.length > 4 && kw.includes(token)))) {
        const posWeight = idx < firstThird ? 1.3 : 1.0;
        matchScore += posWeight;
      }
    }

    // N-gram boost (3x for bigram, 5x for trigram)
    for (const ng of ngrams) {
      if (NGRAMS[ng] === topic) {
        matchScore += ng.split(' ').length >= 3 ? 5 : 3;
      }
    }

    features.push(matchScore / totalTokens);
  }

  return features;
}

function buildTopicModel(): tf.Sequential {
  const l2Reg = tf.regularizers.l2({ l2: 0.0005 });
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [TOPICS.length], units: 48, activation: 'relu', kernelInitializer: 'heNormal', kernelRegularizer: l2Reg }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dense({ units: 24, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: TOPICS.length, activation: 'softmax' }));
  model.compile({ optimizer: tf.train.adam(0.006), loss: 'categoricalCrossentropy' });
  return model;
}

function generateTopicTrainingData(): { xs: tf.Tensor2D; ys: tf.Tensor2D } {
  const xs: number[][] = [];
  const ys: number[][] = [];
  for (let t = 0; t < TOPICS.length; t++) {
    for (let i = 0; i < 45; i++) {
      const features = Array(TOPICS.length).fill(0).map((_, idx) =>
        idx === t ? 0.25 + Math.random() * 0.75 : Math.random() * 0.12
      );
      xs.push(features);
      const label = Array(TOPICS.length).fill(0); label[t] = 1;
      ys.push(label);
    }
    // Add some mixed-topic samples for realism
    for (let i = 0; i < 10; i++) {
      const secondary = (t + 1 + Math.floor(Math.random() * (TOPICS.length - 1))) % TOPICS.length;
      const features = Array(TOPICS.length).fill(0).map((_, idx) =>
        idx === t ? 0.3 + Math.random() * 0.4 : idx === secondary ? 0.15 + Math.random() * 0.25 : Math.random() * 0.08
      );
      xs.push(features);
      const label = Array(TOPICS.length).fill(0); label[t] = 1;
      ys.push(label);
    }
  }
  return { xs: tf.tensor2d(xs), ys: tf.tensor2d(ys) };
}

function extractKeywords(tokens: string[]): Array<{ word: string; score: number; topic?: string }> {
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);

  const allKW = new Map<string, string>();
  for (const [topic, kws] of Object.entries(TOPIC_KEYWORDS)) {
    for (const kw of kws) allKW.set(kw, topic);
  }

  // IDF approximation: common words get lower score
  const totalDocs = 100; // approximate corpus size
  const scored = Array.from(freq.entries()).map(([word, count]) => {
    const tf_score = count / tokens.length;
    const relevance = allKW.has(word) ? 3.5 : 1.0;
    const lengthBoost = word.length > 8 ? 1.5 : word.length > 6 ? 1.3 : word.length > 4 ? 1.1 : 1.0;
    const idfApprox = Math.log(totalDocs / (1 + count * 5)); // penalize very common words
    return {
      word,
      score: Math.round(tf_score * relevance * lengthBoost * Math.max(0.5, idfApprox) * 100) / 100,
      topic: allKW.get(word),
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 15);
}

/**
 * Extractive summarization — select top sentences by keyword density
 */
function extractSummary(text: string, tokens: string[]): string[] {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  if (sentences.length <= 3) return sentences;

  const allTechnical = new Set(Object.values(TOPIC_KEYWORDS).flat());

  const scored = sentences.map((sent, idx) => {
    const sentTokens = tokenize(sent);
    const techCount = sentTokens.filter(t => allTechnical.has(t)).length;
    const techDensity = techCount / (sentTokens.length || 1);
    const positionScore = idx < 2 ? 1.2 : idx < 4 ? 1.0 : 0.8; // first sentences matter more
    const lengthPenalty = sentTokens.length > 30 ? 0.85 : sentTokens.length < 5 ? 0.5 : 1.0;

    return { sentence: sent, score: techDensity * positionScore * lengthPenalty };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .sort((a, b) => text.indexOf(a.sentence) - text.indexOf(b.sentence)) // maintain original order
    .map(s => s.sentence);
}

/**
 * Topic coherence — how focused is the text on a single topic
 */
function computeTopicCoherence(topicProbs: number[]): number {
  // Higher coherence = one topic dominates. Use entropy-based measure.
  const entropy = topicProbs.reduce((s, p) => {
    if (p > 0.001) s -= p * Math.log2(p);
    return s;
  }, 0);
  const maxEntropy = Math.log2(TOPICS.length);
  // Invert: low entropy = high coherence
  return Math.round((1 - entropy / maxEntropy) * 100) / 100;
}

function estimateDifficulty(text: string, tokens: string[]) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordLength = tokens.reduce((s, t) => s + t.length, 0) / (tokens.length || 1);
  const avgSentenceLength = tokens.length / (sentences.length || 1);

  const allTechnical = new Set(Object.values(TOPIC_KEYWORDS).flat());
  const techCount = tokens.filter(t => allTechnical.has(t)).length;
  const techDensity = techCount / (tokens.length || 1);

  // Vocabulary richness (type-token ratio)
  const uniqueTokens = new Set(tokens).size;
  const vocabularyRichness = tokens.length > 0 ? Math.round((uniqueTokens / tokens.length) * 100) / 100 : 0;

  const score = Math.min(1, Math.max(0,
    (avgWordLength - 3) / 10 * 0.15 +
    Math.min(1, avgSentenceLength / 25) * 0.2 +
    techDensity * 0.45 +
    vocabularyRichness * 0.2
  ));

  const level: 'Easy' | 'Medium' | 'Hard' = score < 0.3 ? 'Easy' : score < 0.6 ? 'Medium' : 'Hard';
  return { level, score: Math.round(score * 100) / 100, avgWordLength, avgSentenceLength, techDensity, vocabularyRichness };
}

/**
 * Simplify technical text — find jargon and decode into plain English.
 * Returns both a glossary of found terms and a rewritten version.
 */
function simplifyText(text: string): { simplifiedTerms: SimplifiedTerm[]; simplifiedText: string } {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const lowerText = text.toLowerCase();
  const foundTerms: SimplifiedTerm[] = [];
  const usedTerms = new Set<string>();

  // Check multi-word terms first (longer matches take priority)
  const sortedTerms = Object.keys(TERM_SIMPLIFICATIONS).sort((a, b) => b.length - a.length);

  for (const term of sortedTerms) {
    const lowerTerm = term.toLowerCase();
    if (!lowerText.includes(lowerTerm)) continue;
    if (usedTerms.has(lowerTerm)) continue;

    // Find the sentence containing this term
    const contextSentence = sentences.find(s => s.toLowerCase().includes(lowerTerm)) || '';

    foundTerms.push({
      term,
      explanation: TERM_SIMPLIFICATIONS[term],
      context: contextSentence.trim(),
    });
    usedTerms.add(lowerTerm);

    // Avoid duplicate partial matches (e.g., "neural network" covers "neural")
    const words = lowerTerm.split(' ');
    if (words.length > 1) {
      for (const w of words) usedTerms.add(w);
    }
  }

  // Build simplified text — rewrite each sentence with inline explanations
  let simplified = text;
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [];

  for (const item of foundTerms) {
    // Create a case-insensitive regex that matches the term as a whole word (ish)
    const escaped = item.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i');

    // Only replace the first occurrence to keep text readable
    if (pattern.test(simplified)) {
      replacements.push({
        pattern,
        replacement: `$& (${item.explanation})`,
      });
    }
  }

  // Apply replacements
  const maxReplacements = 20;
  for (let i = 0; i < Math.min(replacements.length, maxReplacements); i++) {
    simplified = simplified.replace(replacements[i].pattern, replacements[i].replacement);
  }

  return {
    simplifiedTerms: foundTerms.slice(0, 30),
    simplifiedText: simplified,
  };
}

/**
 * Analyze text content using NLP + neural classification
 */
export async function analyzeText(text: string): Promise<AnalysisResult> {
  const tokens = tokenize(text);
  const ngrams = detectNgrams(text);
  const entities = detectEntities(text);

  if (tokens.length === 0) {
    return {
      topics: [{ topic: 'General', confidence: 1.0 }],
      keywords: [], difficulty: 'Easy', difficultyScore: 0, wordCount: 0,
      bigramsFound: [], readabilityMetrics: { avgWordLength: 0, avgSentenceLength: 0, techDensity: 0, vocabularyRichness: 0 },
      summary: [], entities: [], topicCoherence: 0,
      simplifiedTerms: [], simplifiedText: '',
    };
  }

  const features = extractTopicFeatures(tokens, ngrams);
  const model = buildTopicModel();
  const { xs, ys } = generateTopicTrainingData();
  await model.fit(xs, ys, { epochs: 30, batchSize: 16, verbose: 0, shuffle: true });

  const inputTensor = tf.tensor2d([features]);
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const probs = await prediction.data();
  const probsArray = Array.from(probs);

  const topicResults: Array<{ topic: Topic; confidence: number }> = TOPICS
    .map((topic, i) => ({ topic, confidence: Math.round(probsArray[i] * 100) / 100 }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  const keywords = extractKeywords(tokens);
  const diffResult = estimateDifficulty(text, tokens);
  const summary = extractSummary(text, tokens);
  const topicCoherence = computeTopicCoherence(probsArray);

  // Simplify technical terms
  const { simplifiedTerms, simplifiedText } = simplifyText(text);

  xs.dispose(); ys.dispose(); inputTensor.dispose(); prediction.dispose(); model.dispose();

  return {
    topics: topicResults,
    keywords,
    difficulty: diffResult.level,
    difficultyScore: diffResult.score,
    wordCount: tokens.length,
    bigramsFound: ngrams,
    readabilityMetrics: {
      avgWordLength: Math.round(diffResult.avgWordLength * 10) / 10,
      avgSentenceLength: Math.round(diffResult.avgSentenceLength * 10) / 10,
      techDensity: Math.round(diffResult.techDensity * 100),
      vocabularyRichness: Math.round(diffResult.vocabularyRichness * 100),
    },
    summary,
    entities,
    topicCoherence,
    simplifiedTerms,
    simplifiedText,
  };
}
