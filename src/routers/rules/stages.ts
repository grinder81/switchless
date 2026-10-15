import type { Rule } from "./rule.js";
import { stage1 } from "./stage1.js";
import { stage2 } from "./stage2.js";
import { stage3 } from "./stage3.js";
import { stage4 } from "./stage4.js";
import { stage5 } from "./stage5.js";
import { stage6 } from "./stage6.js";
import { stage7 } from "./stage7.js";
import { stage8 } from "./stage8.js";

/** Stages in the order they were written. Each one is measured cumulatively. */
export const STAGES: Rule[][] = [stage1, stage2, stage3, stage4, stage5, stage6, stage7, stage8];
