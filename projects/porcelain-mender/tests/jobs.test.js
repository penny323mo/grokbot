// tests/jobs.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS_DATA, ENDINGS_DATA } from '../src/data/jobs.js';

describe('Job Data Integrity', () => {
  test('Contains 12 progressive campaign days', () => {
    assert.strictEqual(JOBS_DATA.length, 12, 'Expected 12 days of campaign jobs');
    JOBS_DATA.forEach((job, index) => {
      assert.strictEqual(job.day, index + 1, `Job day sequence mismatch at index ${index}`);
      assert.ok(job.id, 'Job must have a unique id');
      assert.ok(job.title, 'Job must have a title');
    });
  });

  test('Every job has complete customer and piece specifications', () => {
    JOBS_DATA.forEach(job => {
      assert.ok(job.customer.name, `Job ${job.id} missing customer name`);
      assert.ok(job.customer.portrait, `Job ${job.id} missing customer portrait`);
      assert.ok(job.customer.role, `Job ${job.id} missing customer role`);
      
      assert.ok(job.piece.id, `Job ${job.id} piece missing id`);
      assert.ok(job.piece.name, `Job ${job.id} piece missing name`);
      assert.ok(job.piece.asset, `Job ${job.id} piece missing asset`);
      assert.ok(job.piece.shardsCount >= 3, `Job ${job.id} should have at least 3 shards`);
      assert.ok(job.piece.minStaples > 0, `Job ${job.id} minStaples must be > 0`);
      assert.ok(job.piece.maxStaples >= job.piece.optimalStaples, `Job ${job.id} maxStaples >= optimal`);
      assert.ok(job.piece.optimalStaples >= job.piece.minStaples, `Job ${job.id} optimal >= min`);
    });
  });

  test('Every job has authentic dialogues and pricing options', () => {
    JOBS_DATA.forEach(job => {
      assert.ok(Array.isArray(job.introDialogue) && job.introDialogue.length >= 2, `Job ${job.id} intro dialogue too short`);
      assert.ok(job.inquiryTopic, `Job ${job.id} missing inquiry topic`);
      assert.ok(Array.isArray(job.inquiryDialogue) && job.inquiryDialogue.length >= 2, `Job ${job.id} inquiry dialogue too short`);
      assert.ok(job.pricing.options.length >= 1, `Job ${job.id} has no pricing options`);
      
      job.pricing.options.forEach(opt => {
        assert.ok(typeof opt.price === 'number' && !isNaN(opt.price), `Option price must be a valid number in job ${job.id}`);
        assert.ok(opt.label, `Option missing label in job ${job.id}`);
        assert.ok(opt.customerReply, `Option missing customer reply in job ${job.id}`);
      });

      assert.ok(job.completionDialogue.perfect, `Job ${job.id} missing perfect completion dialogue`);
      assert.ok(job.completionDialogue.good, `Job ${job.id} missing good completion dialogue`);
      assert.ok(job.completionDialogue.leaky, `Job ${job.id} missing leaky completion dialogue`);
    });
  });

  test('All ending routes are properly defined', () => {
    const keys = ['reunion', 'apprentice', 'peaceful', 'community'];
    keys.forEach(k => {
      const ending = ENDINGS_DATA[k];
      assert.ok(ending, `Missing ending definition for ${k}`);
      assert.ok(ending.title, `Ending ${k} missing title`);
      assert.ok(ending.vignette, `Ending ${k} missing vignette`);
      assert.ok(ending.description, `Ending ${k} missing description`);
    });
  });
});
