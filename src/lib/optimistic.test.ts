import { QueryClient } from "@tanstack/react-query"
import { listAppend, listRemove, listReorder } from "./optimistic"

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

const KEY = ["test-items"]

describe("optimistic helpers", () => {
  describe("listAppend", () => {
    it("grows list by one with new item last", async () => {
      const qc = makeClient()
      qc.setQueryData(KEY, [1, 2, 3])

      await listAppend(qc, KEY, 4)

      expect(qc.getQueryData(KEY)).toEqual([1, 2, 3, 4])
    })

    it("works on empty cache (treats undefined as [])", async () => {
      const qc = makeClient()

      await listAppend(qc, KEY, "first")

      expect(qc.getQueryData(KEY)).toEqual(["first"])
    })
  })

  describe("listRemove", () => {
    it("shrinks list by one, predicate-matched item gone", async () => {
      const qc = makeClient()
      qc.setQueryData(KEY, [{ id: "a" }, { id: "b" }, { id: "c" }])

      await listRemove<{ id: string }>(qc, KEY, (item) => item.id === "b")

      expect(qc.getQueryData(KEY)).toEqual([{ id: "a" }, { id: "c" }])
    })
  })

  describe("listReorder", () => {
    it("preserves set membership with new order", async () => {
      const qc = makeClient()
      qc.setQueryData(KEY, ["a", "b", "c"])

      await listReorder<string>(qc, KEY, (items) => [...items].reverse())

      const result = qc.getQueryData<string[]>(KEY)!
      expect(result).toEqual(["c", "b", "a"])
      // same items, different order
      expect([...result].sort()).toEqual(["a", "b", "c"])
    })
  })

  describe("rollback round-trip", () => {
    it("listAppend rollback restores original cache", async () => {
      const qc = makeClient()
      const original = [1, 2, 3]
      qc.setQueryData(KEY, original)

      const { rollback } = await listAppend(qc, KEY, 4)
      rollback()

      expect(qc.getQueryData(KEY)).toEqual(original)
    })

    it("listRemove rollback restores original cache", async () => {
      const qc = makeClient()
      const original = [{ id: "x" }, { id: "y" }]
      qc.setQueryData(KEY, original)

      const { rollback } = await listRemove<{ id: string }>(qc, KEY, (i) => i.id === "x")
      rollback()

      expect(qc.getQueryData(KEY)).toEqual(original)
    })

    it("listReorder rollback restores original cache", async () => {
      const qc = makeClient()
      const original = [1, 2, 3]
      qc.setQueryData(KEY, original)

      const { rollback } = await listReorder<number>(qc, KEY, (items) => [...items].reverse())
      rollback()

      expect(qc.getQueryData(KEY)).toEqual(original)
    })
  })
})
