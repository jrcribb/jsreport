const path = require('path')

const {
  getDataHelperCall, getDataHelperBlockEndCall,
  processOpeningTag, processClosingTag
} = require('../../utils')

module.exports = ({ files, sharedData, addEndCallback }) => {
  const tableFiles = files.filter(f => isTableFile(f.path))

  sharedData.idManagers.set('tables', {
    prefix: '',
    fromItems: {
      getIds: () => {
        const ids = []

        for (const tableFile of tableFiles) {
          const tableDoc = tableFile.doc
          const id = tableDoc.documentElement.getAttribute('id')

          if (id == null || id === '') {
            throw new Error(`Table file ${tableFile.path} does not have a valid id attribute`)
          }

          ids.push(id)
        }

        return ids
      },
      getNumberId: (id) => {
        return parseInt(id, 10)
      }
    }
  })

  const contentTypesFile = files.find(f => f.path === '[Content_Types].xml')
  const defaultNodeName = 'Default'
  const defaultNameProperty = 'Extension'

  const defaultEls = Array.from(contentTypesFile.doc.documentElement.childNodes).filter(
    (el) => el.nodeName === defaultNodeName
  )

  sharedData.listManagers.set('contentTypes.default', {
    nodeName: defaultNodeName,
    keyPropertyName: defaultNameProperty,
    fromItems () {
      const items = []

      for (const defaultEl of defaultEls) {
        const extension = defaultEl.getAttribute(defaultNameProperty)

        items.push([extension, {
          ContentType: defaultEl.getAttribute('ContentType')
        }])
      }

      return items
    }
  })

  const overrideNodeName = 'Override'
  const overrideNameProperty = 'PartName'

  const overrideEls = Array.from(contentTypesFile.doc.documentElement.childNodes).filter(
    (el) => el.nodeName === overrideNodeName
  )

  sharedData.listManagers.set('contentTypes.override', {
    nodeName: overrideNodeName,
    keyPropertyName: overrideNameProperty,
    fromItems () {
      const items = []

      for (const overrideEl of overrideEls) {
        const partName = overrideEl.getAttribute(overrideNameProperty)

        items.push([partName, {
          ContentType: overrideEl.getAttribute('ContentType')
        }])
      }

      return items
    }
  })

  addEndCallback(() => {
    const startCallForDefault = getDataHelperCall('listRecords', { name: 'contentTypes.default' })

    if (defaultEls.length > 0) {
      processOpeningTag(contentTypesFile.doc, defaultEls[0], startCallForDefault)
      processClosingTag(contentTypesFile.doc, defaultEls[defaultEls.length - 1], getDataHelperBlockEndCall())
    } else {
      let targetEl

      if (overrideEls.length > 0) {
        targetEl = overrideEls[0]
      } else {
        targetEl = contentTypesFile.doc.documentElement.firstChild
      }

      const fakeEl = processOpeningTag(contentTypesFile.doc, targetEl, startCallForDefault)
      processClosingTag(contentTypesFile.doc, fakeEl, getDataHelperBlockEndCall())
    }

    const startCallForOverride = getDataHelperCall('listRecords', { name: 'contentTypes.override' })

    if (overrideEls.length > 0) {
      processOpeningTag(contentTypesFile.doc, overrideEls[0], startCallForOverride)
      processClosingTag(contentTypesFile.doc, overrideEls[overrideEls.length - 1], getDataHelperBlockEndCall())
    } else {
      const fakeEl = processOpeningTag(contentTypesFile.doc, false, startCallForOverride)
      contentTypesFile.doc.documentElement.appendChild(fakeEl)
      processClosingTag(contentTypesFile.doc, fakeEl, getDataHelperBlockEndCall())
    }
  })
}

function isTableFile (filePath) {
  return path.posix.dirname(filePath) === 'xl/tables' && filePath.endsWith('.xml')
}
