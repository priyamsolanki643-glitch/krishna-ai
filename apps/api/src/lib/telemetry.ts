import { trace, Tracer } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";

// Initialize OpenTelemetry
const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  instrumentations: [],
});

sdk.start();

export const shutdownTelemetry = async () => {
  await sdk.shutdown();
};

export const getTracer = (): Tracer => trace.getTracer("the-council-api");

export async function withSpan<T>(
  name: string,
  attributes: Record<string, any>,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    // console.log(`[OTel] Started span ${name}`);
    try {
      const result = await fn();
      return result;
    } catch (err: any) {
      span.recordException(err);
      span.setStatus({ code: 2, message: err.message }); // 2 = ERROR
      throw err;
    } finally {
      span.end();
    }
  });
}
