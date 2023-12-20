/**
 * Counts the number of items that satisfy a specific condition.
 * 
 * @param items - An array of items to count.
 * @param propertyPath - The path to the property to compare against.
 * @param value - The value to compare against the property.
 * @returns The count of items that satisfy the condition.
 */
export function countItemsByProperty<T>(items: T[], propertyPath: string, value: any): number {
  return items.filter(item => {
    const properties = propertyPath.split('.');
    const propertyValue = properties.reduce((obj: any, prop: string) => obj && obj[prop], item);

    if (Array.isArray(propertyValue)) {
      return propertyValue.includes(value);
    } else if (value === 'NotNull') {
      return propertyValue !== null;
    } else {
      return propertyValue === value;
    }
  }).length;
}

/**
 * Extracts distinct properties from an array of items based on the provided property path.
 * @param items - The array of items.
 * @param propertyPath - The property path to extract the distinct properties from.
 * @returns An array of distinct properties.
 */
export function extractDistinctProperties<T>(items: T[], propertyPath: string): string[] {
  const propertyCounts: { [property: string]: number } = {};

  items.forEach(item => {
    const properties = propertyPath.split('.');
    const propertyValue = properties.reduce((obj: any, prop: string) => obj && obj[prop], item);

    if (Array.isArray(propertyValue)) {
      propertyValue.forEach(value => {
        if (!propertyCounts[value]) {
          propertyCounts[value] = 0;
        }
        propertyCounts[value]++;
      });
    } else if (propertyValue) {
      if (!propertyCounts[propertyValue]) {
        propertyCounts[propertyValue] = 0;
      }
      propertyCounts[propertyValue]++;
    }
  });

  const sortedProperties = Object.entries(propertyCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([property]) => property);

  return sortedProperties;
}