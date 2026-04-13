import { z } from 'zod'
import { register } from '../registry'

register({
  name: 'calculate',
  description:
    'Evaluate a mathematical expression. Supports basic arithmetic: +, -, *, /, **, %, parentheses.',
  inputSchema: z.object({
    expression: z
      .string()
      .describe('Math expression to evaluate, e.g. "2 + 2 * 3"'),
  }),
  requiresConfirmation: false,
  execute: async (params) => {
    const { expression } = params as { expression: string }
    if (!/^[\d\s+\-*/().%^e]+$/i.test(expression)) {
      return {
        success: false,
        data: null,
        error: `Invalid expression: only numbers and operators allowed`,
      }
    }
    try {
      const sanitized = expression.replace(/\^/g, '**')
      const result = new Function(`"use strict"; return (${sanitized})`)()
      return { success: true, data: { expression, result: Number(result) } }
    } catch {
      return {
        success: false,
        data: null,
        error: `Could not evaluate: ${expression}`,
      }
    }
  },
})
