import { Queue, Worker } from 'bullmq'
import { logger } from './logger'
import { sendMail } from './mailer'

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : null

export const emailQueue = connection ? new Queue('emails', { connection }) : null

if (connection) {
  new Worker(
    'emails',
    async (job) => {
      const { to, subject, html } = job.data as {
        to: string
        subject: string
        html: string
      }
      await sendMail(to, subject, html)
    },
    { connection },
  ).on('error', (error) => logger.error('Email worker failed', error))
}

export async function sendQueuedMail(payload: {
  to: string
  subject: string
  html: string
}) {
  if (emailQueue) {
    await emailQueue.add('send', payload)
    return
  }

  await sendMail(payload.to, payload.subject, payload.html)
}
