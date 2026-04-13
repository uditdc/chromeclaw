import { z } from 'zod'
import { register } from '../registry'

register({
  name: 'get_time',
  description: 'Get the current time and date. Optionally specify a timezone.',
  inputSchema: z.object({
    timezone: z
      .string()
      .optional()
      .describe('IANA timezone, e.g. America/New_York, Asia/Tokyo'),
  }),
  requiresConfirmation: false,
  execute: async (params) => {
    const { timezone } = params as { timezone?: string }
    const now = new Date()
    const formatted = timezone
      ? now.toLocaleString('en-US', { timeZone: timezone })
      : now.toLocaleString()
    return {
      success: true,
      data: { time: formatted, iso: now.toISOString(), timezone: timezone ?? 'local' },
    }
  },
})
