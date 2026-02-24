const STRESSED_WORDS = [
  'stressed', 'stress', 'anxious', 'anxiety', 'nervous', 'panic', 'worried',
  'căng thẳng', 'lo lắng', 'áp lực', 'sợ', 'hoang mang', 'bồn chồn'
];

const OVERWHELMED_WORDS = [
  'overwhelmed', 'too much', 'cant handle', "can't handle", 'drowning', 'impossible',
  'quá tải', 'quá nhiều', 'không thể', 'chịu không nổi', 'ngập đầu'
];

const DEMOTIVATED_WORDS = [
  'unmotivated', 'lazy', 'give up', 'quit', 'pointless', 'boring', "don't care", 'tired',
  'chán', 'mệt mỏi', 'bỏ cuộc', 'vô nghĩa', 'lười', 'không muốn', 'nản'
];

export type Sentiment = 'positive' | 'neutral' | 'stressed' | 'overwhelmed' | 'demotivated';

export function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  
  if (OVERWHELMED_WORDS.some(w => lower.includes(w))) return 'overwhelmed';
  if (STRESSED_WORDS.some(w => lower.includes(w))) return 'stressed';
  if (DEMOTIVATED_WORDS.some(w => lower.includes(w))) return 'demotivated';
  
  return 'neutral';
}
