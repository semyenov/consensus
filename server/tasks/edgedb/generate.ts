import consola from 'consola'
import { execa } from 'execa'

const logger = consola.withTag('[nitro] server:tasks')

export default defineTask({
  meta: {
    name: 'edgedb:generate',
    description: 'Generate EdgeDB schema and types',
  },
  async run({ payload, context }) {
    const controller = new AbortController()
    setTimeout(() => {
      controller.abort()
    }, 5000)

    const { stdout } = await execa({
      cancelSignal: controller.signal,
      preferLocal: true,
    })`edgedb instance credentials --json`

    logger.log({ payload, context, stdout })

    return {
      result: {
        payload: JSON.parse(stdout.split('\n')
          .join('')),
        context: {
          previousExecutionTime: payload?.scheduledTime,
        },
      },
    }
  },
})
