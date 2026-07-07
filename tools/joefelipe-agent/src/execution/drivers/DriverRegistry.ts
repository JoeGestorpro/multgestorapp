import type { ExecutorDriver } from "./types.ts"

/** Registro simples de drivers por id. Registrar um id ja existente substitui
 * o driver anterior (permite trocar um driver placeholder por um real sem
 * mudar quem consome o registry). */
export class DriverRegistry {
  private drivers = new Map<string, ExecutorDriver>()

  register(driver: ExecutorDriver): void {
    this.drivers.set(driver.id, driver)
  }

  get(id: string): ExecutorDriver | undefined {
    return this.drivers.get(id)
  }

  list(): string[] {
    return Array.from(this.drivers.keys())
  }

  get total(): number {
    return this.drivers.size
  }
}
