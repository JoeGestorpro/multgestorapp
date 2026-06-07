// Teste do EventBus REAL (sem mock) — regressão do bug event-bus.js:31
// (ReferenceError: event_name is not defined). Os demais testes mockam o eventBus;
// este exercita o publish de verdade para pegar bugs no caminho real.

const { EventBus } = require('../../src/shared/core/events/event-bus')

describe('EventBus.publish (real, sem mock)', () => {
  it('NÃO lança ReferenceError e retorna o evento com os campos do contrato interno', () => {
    const bus = new EventBus()

    let result
    expect(() => {
      result = bus.publish('test.event', { foo: 'bar' }, {
        company_id: 'co-1',
        aggregate_type: 'test',
        aggregate_id: 'agg-1',
        source: 'unit-test',
      })
    }).not.toThrow()

    expect(result.event_name).toBe('test.event')
    expect(result.company_id).toBe('co-1')
    expect(result.aggregate_type).toBe('test')
    expect(result.aggregate_id).toBe('agg-1')
    expect(result.payload).toEqual({ foo: 'bar' })
    expect(result.event_id).toBeDefined()
    expect(result.occurred_at).toBeDefined()
  })

  it('entrega o evento ao subscriber com event_name e payload corretos', () => {
    const bus = new EventBus()
    const received = []
    bus.subscribe('test.delivered', (evt) => { received.push(evt) })

    bus.publish('test.delivered', { x: 1 }, { company_id: 'co-9' })

    expect(received).toHaveLength(1)
    expect(received[0].event_name).toBe('test.delivered')
    expect(received[0].company_id).toBe('co-9')
    expect(received[0].payload).toEqual({ x: 1 })
  })

  it('emite também no canal wildcard (*)', () => {
    const bus = new EventBus()
    const all = []
    bus.subscribe('*', (evt) => { all.push(evt.event_name) })

    bus.publish('test.a', {}, {})
    bus.publish('test.b', {}, {})

    expect(all).toEqual(['test.a', 'test.b'])
  })

  it('publish sem metadata não lança e usa defaults', () => {
    const bus = new EventBus()
    let result
    expect(() => { result = bus.publish('test.nometa', { a: 1 }) }).not.toThrow()
    expect(result.event_name).toBe('test.nometa')
    expect(result.company_id).toBeNull()
  })
})
