import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export class ContractEngine {
  /**
   * Compares two schemas and finds breaking changes
   */
  static compareSchemas(baseSchema: any, targetSchema: any) {
    const changes: { type: 'breaking' | 'non-breaking' | 'info'; message: string; path?: string }[] = [];

    // Simple diff logic (in a real app this would be more complex)
    const baseProperties = baseSchema.properties || {};
    const targetProperties = targetSchema.properties || {};

    // Check for removed properties
    Object.keys(baseProperties).forEach(key => {
      if (!targetProperties[key]) {
        changes.push({
          type: 'breaking',
          message: `Property '${key}' was removed from the response schema.`,
          path: key
        });
      } else {
        // Check for type changes
        if (baseProperties[key].type !== targetProperties[key].type) {
           changes.push({
             type: 'breaking',
             message: `Property '${key}' changed type from ${baseProperties[key].type} to ${targetProperties[key].type}.`,
             path: key
           });
        }
      }
    });

    // Check for new properties
    Object.keys(targetProperties).forEach(key => {
      if (!baseProperties[key]) {
        changes.push({
          type: 'info',
          message: `New property '${key}' added to the schema.`,
          path: key
        });
      }
    });

    return {
      isCompatible: !changes.some(c => c.type === 'breaking'),
      changes
    };
  }

  /**
   * Validates data against a contract schema
   */
  static validate(data: any, schema: any) {
    try {
      const validate = ajv.compile(schema);
      const valid = validate(data);
      return {
        isValid: valid,
        errors: validate.errors?.map(e => `${e.instancePath} ${e.message}`) || []
      };
    } catch (e: any) {
      return { isValid: false, errors: [`Schema Error: ${e.message}`] };
    }
  }
}
