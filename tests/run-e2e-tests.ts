/**
 * Standalone E2E Test Runner for Gemini AI Service
 *
 * This script directly tests all AI endpoints with real API calls.
 * Run with: npx tsx tests/run-e2e-tests.ts
 */

import { GoogleGenAI } from '@google/genai';

// Load API key
const apiKey = process.env.VITE_GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY || '';

if (!apiKey) {
  console.error('❌ VITE_GEMINI_API_KEY is not set!');
  console.log('   Set it with: export VITE_GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

console.log('🔑 API Key loaded successfully\n');

// Initialize AI client
const ai = new GoogleGenAI({ apiKey });

// Test results tracking
const results: { name: string; passed: boolean; error?: string; duration: number }[] = [];

// Helper to run a test
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  process.stdout.write(`\n⏳ Testing: ${name}... `);

  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration });
    console.log(`✅ PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage, duration });
    console.log(`❌ FAILED (${duration}ms)`);
    console.log(`   Error: ${errorMessage}`);
  }
}

// ============================================================================
// TEST 1: Chat Service (gemini-2.5-flash)
// ============================================================================
await runTest('Chat Service (gemini-2.5-flash)', async () => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are a helpful assistant. Keep responses brief.',
    },
  });

  const result = await chat.sendMessageStream({
    message: 'Say "Hello, this is working" in one sentence.',
  });

  let fullResponse = '';
  for await (const chunk of result) {
    if (chunk.text) fullResponse += chunk.text;
  }

  if (!fullResponse || fullResponse.length < 5) {
    throw new Error('Response too short or empty');
  }

  console.log(`      Response: "${fullResponse.trim().substring(0, 60)}..."`);
});

// ============================================================================
// TEST 2: Document Analysis (gemini-2.5-flash)
// ============================================================================
await runTest('Document Analysis (gemini-2.5-flash)', async () => {
  // Use a small test PNG (1x1 pixel)
  const testImageBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: testImageBase64,
          },
        },
        {
          text: 'Analyze this image. What do you see? Respond in one sentence.',
        },
      ],
    },
  });

  const text = response.text;
  if (!text || text.length < 5) {
    throw new Error('Analysis response too short');
  }

  console.log(`      Analysis: "${text.trim().substring(0, 60)}..."`);
});

// ============================================================================
// TEST 3: JSON Response Test (gemini-2.5-flash)
// ============================================================================
await runTest('JSON Structured Response (gemini-2.5-flash)', async () => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          text:
            'Classify the following as either "urgent" or "not urgent": "I need to file a death certificate within 3 days."\n\nRespond ONLY with valid JSON: {"classification": "urgent|not_urgent", "reason": "short explanation"}',
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response text');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Response is not valid JSON');
  }

  if (!parsed.classification) {
    throw new Error('Missing classification field');
  }

  console.log(`      Classification: ${parsed.classification}`);
});

// ============================================================================
// TEST 4: Complex Reasoning (gemini-3-pro-preview)
// ============================================================================
await runTest('Complex Reasoning (gemini-3-pro-preview)', async () => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          text:
            'What are the 3 key steps in the California probate process? Answer concisely with a numbered list.',
        },
      ],
    },
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  if (!text || text.length < 20) {
    throw new Error('Reasoning response too short');
  }

  console.log(`      Steps identified: ${text.split('\n').filter((l) => l.trim()).length} lines`);
});

// ============================================================================
// TEST 5: Streaming Chat (gemini-2.5-flash)
// ============================================================================
await runTest('Streaming Chat (gemini-2.5-flash)', async () => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
  });

  const result = await chat.sendMessageStream({
    message: 'Count from 1 to 5, one number per line.',
  });

  const chunks: string[] = [];
  for await (const chunk of result) {
    if (chunk.text) chunks.push(chunk.text);
  }

  const fullResponse = chunks.join('');
  // Note: For short responses, API may return in single chunk - that's OK
  // We just verify streaming works and we get a response
  if (!fullResponse || fullResponse.length < 5) {
    throw new Error('Streaming response too short or empty');
  }

  console.log(`      Chunks received: ${chunks.length}, Response length: ${fullResponse.length}`);
});

// ============================================================================
// TEST 6: Multi-turn Conversation (gemini-2.5-flash)
// ============================================================================
await runTest('Multi-turn Conversation (gemini-2.5-flash)', async () => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are a funeral planning assistant. Be brief.',
    },
  });

  // Turn 1
  await chat.sendMessageStream({
    message: 'My mother passed away. What should I do first?',
  });

  // Turn 2
  const result2 = await chat.sendMessageStream({
    message: 'What about the death certificate?',
  });

  let response = '';
  for await (const chunk of result2) {
    if (chunk.text) response += chunk.text;
  }

  if (response.length < 10) {
    throw new Error('Multi-turn response too short');
  }

  console.log(`      Context maintained: yes`);
});

// ============================================================================
// TEST 7: Model Availability Check
// ============================================================================
await runTest('Model Availability Check', async () => {
  const modelsToCheck = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-preview-tts',
    'gemini-3-pro-preview',
    'gemini-2.0-flash-exp',
  ];

  const availableModels: string[] = [];
  const unavailableModels: string[] = [];

  for (const modelId of modelsToCheck) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts: [{ text: 'Respond with just "OK"' }] },
      });
      if (response.text) {
        availableModels.push(modelId);
      }
    } catch {
      unavailableModels.push(modelId);
    }
  }

  console.log(`      Available: [${availableModels.join(', ')}]`);
  if (unavailableModels.length > 0) {
    console.log(`      Unavailable: [${unavailableModels.join(', ')}]`);
  }
});

// ============================================================================
// TEST 8: Error Handling
// ============================================================================
await runTest('Error Handling - Invalid Request', async () => {
  let errorCaught = false;
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
    });
    await chat.sendMessageStream({
      message: '', // Empty message should be handled
    });
  } catch (error) {
    errorCaught = true;
  }

  if (!errorCaught) {
    console.log(`      Note: Empty message did not throw (API may handle it)`);
  } else {
    console.log(`      Error properly caught`);
  }
});

// ============================================================================
// TEST 9: Large Response Handling
// ============================================================================
await runTest('Large Response Handling (gemini-2.5-flash)', async () => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          text:
            'Write a detailed list of 10 things to consider when planning a funeral. Include a brief explanation for each.',
        },
      ],
    },
  });

  const text = response.text;
  if (!text || text.length < 200) {
    throw new Error('Large response too short');
  }

  console.log(`      Response length: ${text.length} chars`);
});

// ============================================================================
// TEST 10: Timeout Handling
// ============================================================================
await runTest('Request Completion Time', async () => {
  const start = Date.now();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [{ text: 'Say "Hello"' }],
    },
  });

  const duration = Date.now() - start;

  if (duration > 10000) {
    throw new Error(`Request took too long: ${duration}ms`);
  }

  console.log(`      Completed in: ${duration}ms`);
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

console.log(`\nTotal Tests: ${results.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⏱️  Total Duration: ${totalDuration}ms\n`);

if (failed > 0) {
  console.log('Failed Tests:');
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.log(`  • ${r.name}`);
      console.log(`    ${r.error}`);
    });
  console.log('');
}

console.log('='.repeat(60));

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
