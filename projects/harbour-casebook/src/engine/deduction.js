/**
 * 濠江疑案 · Harbour Casebook
 * 推理校驗引擎 (Deduction Checker Logic)
 * 依照 SPEC 要求實作「黃金偶像 (Golden Idol)」風格部分回饋
 */

export const CHECK_STATUS = {
  INCOMPLETE: 'INCOMPLETE',
  CORRECT: 'CORRECT',
  PARTIAL: 'PARTIAL',
  MANY_ERRORS: 'MANY_ERRORS'
};

/**
 * 檢查單一推理章節 (Section) 的填寫結果
 * @param {Object} section - case.deductionSections 中的單節物件
 * @param {Object} filledSlots - { [slotKey]: selectedWord }
 * @returns {Object} { status, message, errorCount, totalSlots, isComplete }
 */
export function checkSection(section, filledSlots = {}) {
  const slots = section.slots || [];
  const totalSlots = slots.length;

  // 1. 檢查是否所有空白均已填滿
  const unfilledSlots = slots.filter(s => !filledSlots[s.key]);
  if (unfilledSlots.length > 0) {
    return {
      status: CHECK_STATUS.INCOMPLETE,
      message: `尚有 ${unfilledSlots.length} 處空白未完成填寫。`,
      errorCount: null,
      totalSlots,
      isComplete: false
    };
  }

  // 2. 比對所有空格的答案
  const wrongSlots = slots.filter(s => filledSlots[s.key] !== s.answer);
  const errorCount = wrongSlots.length;

  if (errorCount === 0) {
    return {
      status: CHECK_STATUS.CORRECT,
      message: '全部正確！推理絲絲入扣，真相大白。',
      errorCount: 0,
      totalSlots,
      isComplete: true
    };
  }

  if (errorCount <= 2) {
    // Golden Idol partial feedback: 僅告知「有 2 處或以下錯誤」，絕不劇透具體哪一格
    return {
      status: CHECK_STATUS.PARTIAL,
      message: '有 2 處或以下錯誤！已極為接近真相，請複查關鍵線索。',
      errorCount,
      totalSlots,
      isComplete: true
    };
  }

  return {
    status: CHECK_STATUS.MANY_ERRORS,
    message: '尚有較多疑點未解，推論尚未成立，請再勘驗案發現場。',
    errorCount,
    totalSlots,
    isComplete: true
  };
}

/**
 * 檢查整案是否已全部完成章節推理
 * @param {Object} caseData - CASE 物件
 * @param {Array<string>} solvedSections - 已通過的章節 id 清單
 * @returns {boolean}
 */
export function isAllSectionsSolved(caseData, solvedSections = []) {
  if (!caseData || !caseData.deductionSections) return false;
  return caseData.deductionSections.every(sec => solvedSections.includes(sec.id));
}

/**
 * 檢查人物圖鑑 (Who's Who) 匹配 (Golden Idol 規則反饋)
 * @param {Array} whosWhoList - caseData.whosWho
 * @param {Object} guesses - { [portraitId]: nameGuess }
 * @returns {Object} { status, message, errorCount, correctCount, total, isAllCorrect, isComplete }
 */
export function checkWhosWho(whosWhoList = [], guesses = {}) {
  const total = whosWhoList.length;
  if (total === 0) {
    return {
      status: CHECK_STATUS.CORRECT,
      message: '全案人物均已核對確認。',
      errorCount: 0,
      correctCount: 0,
      total: 0,
      isAllCorrect: true,
      isComplete: true
    };
  }

  // 1. 檢查是否全部空白皆已填入
  const filledCount = whosWhoList.filter(item => {
    const val = guesses[item.portraitId];
    return val !== null && val !== undefined && val !== '';
  }).length;

  if (filledCount < total) {
    return {
      status: CHECK_STATUS.INCOMPLETE,
      message: '尚有人物姓名空白未填，請為所有肖像填入指認姓名。',
      errorCount: null,
      correctCount: null,
      total,
      isAllCorrect: false,
      isComplete: false
    };
  }

  // 2. 計算錯誤數
  let wrongCount = 0;
  whosWhoList.forEach(item => {
    if (guesses[item.portraitId] !== item.answer) {
      wrongCount++;
    }
  });

  const correctCount = total - wrongCount;
  const isAllCorrect = wrongCount === 0;

  if (isAllCorrect) {
    return {
      status: CHECK_STATUS.CORRECT,
      message: '人物譜全部正確！涉案人等身份均已查明。',
      errorCount: 0,
      correctCount,
      total,
      isAllCorrect: true,
      isComplete: true
    };
  }

  if (wrongCount <= 2) {
    return {
      status: CHECK_STATUS.PARTIAL,
      message: '有 2 處或以下錯誤！指認已極為接近真相，請參詳現場證供。',
      errorCount: wrongCount,
      correctCount,
      total,
      isAllCorrect: false,
      isComplete: true
    };
  }

  return {
    status: CHECK_STATUS.MANY_ERRORS,
    message: '指認多處有誤，請再行核對現場供詞與物證。',
    errorCount: wrongCount,
    correctCount,
    total,
    isAllCorrect: false,
    isComplete: true
  };
}
