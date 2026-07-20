
function createListCollectionManager () {
  const collection = new Map()

  return {
    has (key) {
      assertOk(key != null, 'key is required')
      return collection.has(key)
    },
    get (key) {
      assertOk(key != null, 'key is required')
      return collection.get(key)
    },
    set (key, managerSpec) {
      assertOk(key != null, 'key is required')
      assertOk(managerSpec != null, 'managerSpec is required')

      const manager = createListManager(key, managerSpec)
      collection.set(key, manager)
      return manager
    },
    all () {
      return collection.entries()
    }
  }
}

function createListManager (name, options = {}) {
  assertOk(name != null, 'name must be provided')

  const { nodeName, keyPropertyName, fromItems } = options

  assertOk(nodeName != null && nodeName !== '', 'nodeName must be provided')
  assertOk(keyPropertyName != null && keyPropertyName !== '', 'keyPropertyName must be provided')
  assertOk(fromItems != null, 'fromItems implementation must be provided')

  const originItems = fromItems()

  const baseItems = new Map()

  for (const [key, item] of originItems) {
    baseItems.set(key, item)
  }

  const newItems = new Map()

  const keyDataVariableName = '__recordKeyName__'

  return {
    get nodeName () {
      return nodeName
    },
    get keyPropertyName () {
      return keyPropertyName
    },
    get keyDataVariableName () {
      return keyDataVariableName
    },
    has (key, target = 'all') {
      if (target === 'all') {
        return newItems.has(key) || baseItems.has(key)
      } else if (target === 'base') {
        return baseItems.has(key)
      } else if (target === 'new') {
        return newItems.has(key)
      }

      throw new Error(`Invalid target value: ${target}`)
    },
    get (key, target = 'all') {
      if (target === 'all') {
        if (newItems.has(key)) {
          return newItems.get(key)
        }

        return baseItems.get(key)
      } else if (target === 'base') {
        return baseItems.get(key)
      } else if (target === 'new') {
        return newItems.get(key)
      }

      throw new Error(`Invalid target value: ${target}`)
    },
    set (key, item) {
      newItems.set(key, item)
    },
    all (target = 'all') {
      if (target === 'all') {
        const merged = new Map([
          ...baseItems.entries(),
          ...newItems.entries()
        ])

        return merged.entries()
      } else if (target === 'base') {
        return baseItems.entries()
      } else if (target === 'new') {
        return newItems.entries()
      }

      throw new Error(`Invalid target value: ${target}`)
    }
  }
}

function assertOk (valid, message) {
  if (!valid) {
    throw new Error(message)
  }
}

module.exports.createListCollectionManager = createListCollectionManager
