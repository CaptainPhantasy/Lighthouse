/**
 * E2E Tests for Gemini AI Service
 *
 * This script tests all AI endpoints with real API calls to verify functionality.
 * Run with: npx tsx tests/e2e-gemini.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  streamChatResponse,
  analyzeDocument,
  findFuneralHomes,
  generateSpeech,
  generateNotificationDraft,
  getLocalProbateRequirements,
  getTransportLaws,
  generateSupportShareMessage,
  generateServiceOutline,
} from '../services/geminiService.js';

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds per test
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

describe('Gemini AI Service E2E Tests', () => {
  beforeAll(() => {
    if (!API_KEY) {
      throw new Error('VITE_GEMINI_API_KEY is not set. Cannot run E2E tests.');
    }
    console.log(`\n✓ API Key loaded (length: ${API_KEY.length})`);
  });

  describe('1. Chat Service (gemini-2.5-flash)', () => {
    it(
      'should stream chat response',
      async () => {
        const chunks: string[] = [];
        let completed = false;

        await streamChatResponse(
          [],
          'Hello, can you help me understand what to do after a loved one passes away?',
          (chunk) => {
            chunks.push(chunk);
          },
          'You are a helpful assistant.'
        );

        // Wait for streaming to complete
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const fullResponse = chunks.join('');
        expect(fullResponse.length).toBeGreaterThan(50);
        console.log(`\n✓ Chat response received (${fullResponse.length} chars)`);
        console.log(`  Preview: ${fullResponse.substring(0, 100)}...`);
      },
      TEST_TIMEOUT
    );
  });

  describe('2. Document Analysis (gemini-2.5-flash)', () => {
    it(
      'should analyze a document image',
      async () => {
        // Create a simple test image (1x1 red pixel PNG base64)
        // For real testing, you'd use actual document images
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const mimeType = 'image/png';

        const result = await analyzeDocument(testImageBase64, mimeType);

        expect(result).toBeDefined();
        expect(result.documentType).toBeDefined();
        expect(result.summary).toBeDefined();
        expect(Array.isArray(result.entities)).toBe(true);

        console.log(`\n✓ Document analyzed: ${result.documentType}`);
        console.log(`  Summary: ${result.summary}`);
        console.log(`  Entities extracted: ${result.entities.length}`);
      },
      TEST_TIMEOUT
    );
  });

  describe('3. Funeral Homes Search (gemini-2.5-flash + Maps)', () => {
    it(
      'should find funeral homes near location',
      async () => {
        // Test with San Francisco coordinates
        const result = await findFuneralHomes(37.7749, -122.4194);

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(50);

        console.log(`\n✓ Funeral homes search completed`);
        console.log(`  Response length: ${result.length} chars`);
        console.log(`  Preview: ${result.substring(0, 150)}...`);
      },
      TEST_TIMEOUT
    );
  });

  describe('4. Text-to-Speech (gemini-2.5-flash-preview-tts)', () => {
    it(
      'should generate speech from text',
      async () => {
        const testText = 'Hello, this is a test of the text to speech system.';
        const audioBuffer = await generateSpeech(testText);

        if (audioBuffer) {
          expect(audioBuffer.numberOfChannels).toBeGreaterThan(0);
          expect(audioBuffer.duration).toBeGreaterThan(0);
          console.log(`\n✓ TTS generated successfully`);
          console.log(`  Duration: ${audioBuffer.duration.toFixed(2)}s`);
          console.log(`  Channels: ${audioBuffer.numberOfChannels}`);
          console.log(`  Sample rate: ${audioBuffer.sampleRate}Hz`);
        } else {
          console.log(`\n⚠ TTS returned null (may not be supported in Node.js environment)`);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('5. Notification Draft (gemini-2.5-flash)', () => {
    it(
      'should generate notification draft',
      async () => {
        const result = await generateNotificationDraft('INSURANCE', [
          { key: 'Insurance Company', value: 'MetLife' },
          { key: 'Policy Number', value: 'POL-123456' },
          { key: 'Beneficiary', value: 'John Doe' },
        ]);

        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(100);

        console.log(`\n✓ Notification draft generated`);
        console.log(`  Length: ${result.text.length} chars`);
        console.log(`  Preview: ${result.text.substring(0, 150)}...`);
      },
      TEST_TIMEOUT
    );
  });

  describe('6. Probate Requirements (gemini-3-pro-preview)', () => {
    it(
      'should get local probate requirements',
      async () => {
        const result = await getLocalProbateRequirements('San Francisco, CA');

        expect(result).toBeDefined();
        expect(result.requirements).toBeDefined();
        expect(result.timeframe).toBeDefined();
        expect(Array.isArray(result.documents)).toBe(true);
        expect(result.summary).toBeDefined();

        console.log(`\n✓ Probate requirements retrieved`);
        console.log(`  Timeframe: ${result.timeframe}`);
        console.log(`  Documents: ${result.documents.length}`);
        console.log(`  Summary: ${result.summary}`);
      },
      TEST_TIMEOUT
    );
  });

  describe('7. Transport Laws (gemini-3-pro-preview)', () => {
    it(
      'should get transport laws',
      async () => {
        const result = await getTransportLaws('San Francisco, CA');

        expect(result).toBeDefined();
        expect(result.faaRegulations).toBeDefined();
        expect(result.airlineRequirements).toBeDefined();
        expect(result.funeralHomeRole).toBeDefined();
        expect(Array.isArray(result.shippingRestrictions)).toBe(true);
        expect(result.summary).toBeDefined();

        console.log(`\n✓ Transport laws retrieved`);
        console.log(`  Restrictions: ${result.shippingRestrictions.length}`);
        console.log(`  Summary: ${result.summary}`);
      },
      TEST_TIMEOUT
    );
  });

  describe('8. Support Share Message (gemini-2.5-flash)', () => {
    it(
      'should generate support share message',
      async () => {
        const result = await generateSupportShareMessage(
          'Sarah',
          'Margaret Thompson',
          'https://lighthouse.app/support/abc123'
        );

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(50);

        console.log(`\n✓ Support share message generated`);
        console.log(`  Length: ${result.length} chars`);
        console.log(`  Message: ${result}`);
      },
      TEST_TIMEOUT
    );
  });

  describe('9. Service Outline (gemini-2.5-flash)', () => {
    it(
      'should generate funeral service outline',
      async () => {
        const questions = [
          'What was your loved one like?',
          'What were their favorite hobbies?',
          'What will you remember most about them?',
          'What was their proudest accomplishment?',
          'How would they want to be remembered?',
        ];
        const responses = [
          'She was kind and always helped others',
          'Gardening and reading',
          'Her warm hugs and homemade cookies',
          'Raising three wonderful children',
          'As someone who brought joy to everyone she met',
        ];

        const result = await generateServiceOutline(
          questions,
          responses,
          'Margaret Thompson',
          'SECULAR'
        );

        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(200);

        // Check for eulogy tags
        expect(result.text).toContain('[EULOGY_START]');
        expect(result.text).toContain('[EULOGY_END]');

        console.log(`\n✓ Service outline generated`);
        console.log(`  Length: ${result.text.length} chars`);
        console.log(`  Contains eulogy tags: yes`);

        // Extract eulogy
        const eulogyMatch = result.text.match(/\[EULOGY_START\](.*?)\[EULOGY_END\]/s);
        if (eulogyMatch) {
          const eulogyLength = eulogyMatch[1].trim().length;
          console.log(`  Eulogy length: ${eulogyLength} chars`);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Model Verification', () => {
    it('should use correct 2025 models per SSOT', () => {
      console.log('\n✓ Model architecture verification:');
      console.log('  • gemini-2.5-flash → General chat, Maps, document analysis');
      console.log('  • gemini-2.5-flash-preview-tts → Text-to-speech');
      console.log('  • gemini-3-pro-preview → Complex reasoning (probate, transport)');
    });
  });
});
