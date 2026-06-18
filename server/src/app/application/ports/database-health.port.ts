export abstract class DatabaseHealthPort {
  abstract isHealthy(): Promise<boolean>;
}
