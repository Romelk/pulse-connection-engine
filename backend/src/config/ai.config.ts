import 'dotenv/config';

export const aiConfig = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  model: 'claude-3-haiku-20240307', // Fast and cost-effective for production
  maxTokens: 1024,
  enabled: !!process.env.ANTHROPIC_API_KEY,
};
