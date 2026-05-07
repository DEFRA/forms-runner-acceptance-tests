class List {
  constructor() {
    this.list = new Map()
  }

  addItem(key, value) {
    this.list.set(key, value)
  }

  /**
   * @param {string} key  item key
   * @returns {object | undefined} The item object or undefined if not found
   */
  getItem(key) {
    return this.list.get(key)
  }

  /**
   * Get all items in the list
   * @returns {Array<object>}  Array of all items
   */
  getAllItems() {
    return Array.from(this.list.values())
  }

  /**
   * Get all item keys
   * @returns {Array<string>} Array of item keys
   */
  getAllKeys() {
    return Array.from(this.list.keys())
  }

  /**
   * Get the size of the list
   * @returns {number} Number of items in the list
   */
  size() {
    return this.list.size
  }
}

/**
 * @typedef {object} ListItem
 * @property {string} id Item id
 * @property {string} text Display text
 * @property {string} value Stored value
 */

/**
 * @typedef {object} ListControllerOptions
 * @property {string} id - The list ID
 * @property {string} name - The list name
 * @property {string} title - The list title
 * @property {string} type - The list type (e.g., "string")
 * @property {ListItem[]} [items] - Optional array of items to initialize
 */

export class ListController {
  /**
   * @param {ListControllerOptions} options Controller options
   */
  constructor({ id, name, title, type, items }) {
    this.id = id
    this.name = name
    this.title = title
    this.type = type
    this.list = new List()
    this.items = items || []

    // Initialize list with items if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        this.list.addItem(item.id, item)
      }
    }
  }

  /**
   * Add an item to the list
   * @param {string} key Item id
   * @param {ListItem} value Item
   */
  addItem(key, value) {
    this.list.addItem(key, value)
    this.items.push(value)
  }

  /**
   * Get an item by its ID
   * @param {string} key Item id
   * @returns {ListItem | undefined} Item if found
   */
  getItem(key) {
    return this.list.getItem(key)
  }

  /**
   * Find an item by its ID (alias for getItem)
   * @param {string} key Item id
   * @returns {ListItem | undefined} Item if found
   */
  findItem(key) {
    return this.list.getItem(key)
  }

  /**
   * Find an item by its text value
   * @param {string} text Display text
   * @returns {ListItem | undefined} Item if found
   */
  findItemByText(text) {
    return this.items.find((item) => item.text === text)
  }

  /**
   * Find an item by its value
   * @param {string} value Stored value
   * @returns {ListItem | undefined} Item if found
   */
  findItemByValue(value) {
    return this.items.find((item) => item.value === value)
  }

  /**
   * Get the underlying List object
   * @returns {List} Internal list storage
   */
  getList() {
    return this.list
  }

  /**
   * Get all items as an array
   * @returns {ListItem[]} All items
   */
  getAllItems() {
    return this.items
  }

  /**
   * Get all item texts as an array
   * @returns {string[]} All item texts
   */
  getAllTexts() {
    return this.items.map((item) => item.text)
  }

  /**
   * Get all item values as an array
   * @returns {string[]} All item values
   */
  getAllValues() {
    return this.items.map((item) => item.value)
  }

  /**
   * Get the first item in the list
   * @returns {ListItem | undefined} First item if present
   */
  getFirstItem() {
    return this.items[0]
  }

  /**
   * Get the last item in the list
   * @returns {ListItem | undefined} Last item if present
   */
  getLastItem() {
    return this.items[this.items.length - 1]
  }

  /**
   * Get the number of items in the list
   * @returns {number} Number of items
   */
  size() {
    return this.items.length
  }
}
