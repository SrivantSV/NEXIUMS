import {
  CollaborationOperation,
  TextInsertOperation,
  TextDeleteOperation,
  TextFormatOperation,
} from '@/types/collaboration';

/**
 * ConflictResolver - Implements Operational Transformation (OT) for concurrent editing
 * Ensures all clients converge to the same state despite concurrent operations
 */
export class ConflictResolver {
  /**
   * Transform an operation against concurrent operations
   */
  async transform(
    operation: CollaborationOperation,
    existingOperations: CollaborationOperation[],
    userId: string
  ): Promise<CollaborationOperation> {
    let transformedOp = { ...operation };

    // Find concurrent operations (operations that happened after this one was created)
    const concurrentOps = existingOperations.filter(
      (op) => op.timestamp > operation.timestamp && op.userId !== userId
    );

    // Transform against each concurrent operation
    for (const concurrentOp of concurrentOps) {
      transformedOp = await this.transformAgainstOperation(
        transformedOp,
        concurrentOp
      );
    }

    return transformedOp;
  }

  /**
   * Transform one operation against another
   */
  private async transformAgainstOperation(
    op1: CollaborationOperation,
    op2: CollaborationOperation
  ): Promise<CollaborationOperation> {
    switch (op1.type) {
      case 'text_insert':
        return this.transformTextInsert(op1 as TextInsertOperation, op2);
      case 'text_delete':
        return this.transformTextDelete(op1 as TextDeleteOperation, op2);
      case 'text_format':
        return this.transformTextFormat(op1 as TextFormatOperation, op2);
      default:
        return op1;
    }
  }

  /**
   * Transform a text insert operation
   */
  private transformTextInsert(
    insertOp: TextInsertOperation,
    otherOp: CollaborationOperation
  ): CollaborationOperation {
    if (otherOp.type === 'text_insert') {
      const otherInsert = otherOp as TextInsertOperation;
      if (otherInsert.data.position <= insertOp.data.position) {
        // Adjust position forward by the length of the other insert
        return {
          ...insertOp,
          data: {
            ...insertOp.data,
            position: insertOp.data.position + otherInsert.data.text.length,
          },
        };
      }
    } else if (otherOp.type === 'text_delete') {
      const otherDelete = otherOp as TextDeleteOperation;
      if (otherDelete.data.position < insertOp.data.position) {
        // Adjust position backward by the length of the delete
        return {
          ...insertOp,
          data: {
            ...insertOp.data,
            position: Math.max(
              0,
              insertOp.data.position - otherDelete.data.length
            ),
          },
        };
      }
    }

    return insertOp;
  }

  /**
   * Transform a text delete operation
   */
  private transformTextDelete(
    deleteOp: TextDeleteOperation,
    otherOp: CollaborationOperation
  ): CollaborationOperation {
    if (otherOp.type === 'text_insert') {
      const otherInsert = otherOp as TextInsertOperation;
      if (otherInsert.data.position <= deleteOp.data.position) {
        // Adjust position forward
        return {
          ...deleteOp,
          data: {
            ...deleteOp.data,
            position: deleteOp.data.position + otherInsert.data.text.length,
          },
        };
      } else if (
        otherInsert.data.position <
        deleteOp.data.position + deleteOp.data.length
      ) {
        // Insert is within delete range, adjust length
        return {
          ...deleteOp,
          data: {
            ...deleteOp.data,
            length: deleteOp.data.length + otherInsert.data.text.length,
          },
        };
      }
    } else if (otherOp.type === 'text_delete') {
      const otherDelete = otherOp as TextDeleteOperation;

      // Check if deletes overlap
      const op1End = deleteOp.data.position + deleteOp.data.length;
      const op2End = otherDelete.data.position + otherDelete.data.length;

      if (otherDelete.data.position < deleteOp.data.position) {
        if (op2End <= deleteOp.data.position) {
          // Other delete is completely before this one
          return {
            ...deleteOp,
            data: {
              ...deleteOp.data,
              position: Math.max(
                0,
                deleteOp.data.position - otherDelete.data.length
              ),
            },
          };
        } else {
          // Deletes overlap, adjust both position and length
          const overlap = Math.min(op2End - deleteOp.data.position, deleteOp.data.length);
          return {
            ...deleteOp,
            data: {
              ...deleteOp.data,
              position: otherDelete.data.position,
              length: Math.max(0, deleteOp.data.length - overlap),
            },
          };
        }
      }
    }

    return deleteOp;
  }

  /**
   * Transform a text format operation
   */
  private transformTextFormat(
    formatOp: TextFormatOperation,
    otherOp: CollaborationOperation
  ): CollaborationOperation {
    if (otherOp.type === 'text_insert') {
      const otherInsert = otherOp as TextInsertOperation;

      if (otherInsert.data.position <= formatOp.data.start) {
        // Insert before format range, adjust both start and end
        return {
          ...formatOp,
          data: {
            ...formatOp.data,
            start: formatOp.data.start + otherInsert.data.text.length,
            end: formatOp.data.end + otherInsert.data.text.length,
          },
        };
      } else if (otherInsert.data.position < formatOp.data.end) {
        // Insert within format range, adjust end
        return {
          ...formatOp,
          data: {
            ...formatOp.data,
            end: formatOp.data.end + otherInsert.data.text.length,
          },
        };
      }
    } else if (otherOp.type === 'text_delete') {
      const otherDelete = otherOp as TextDeleteOperation;
      const deleteEnd = otherDelete.data.position + otherDelete.data.length;

      if (deleteEnd <= formatOp.data.start) {
        // Delete before format range
        return {
          ...formatOp,
          data: {
            ...formatOp.data,
            start: Math.max(0, formatOp.data.start - otherDelete.data.length),
            end: Math.max(0, formatOp.data.end - otherDelete.data.length),
          },
        };
      } else if (
        otherDelete.data.position < formatOp.data.end &&
        deleteEnd > formatOp.data.start
      ) {
        // Delete overlaps format range
        const overlap = Math.min(
          deleteEnd - Math.max(otherDelete.data.position, formatOp.data.start),
          formatOp.data.end - formatOp.data.start
        );

        return {
          ...formatOp,
          data: {
            ...formatOp.data,
            start: Math.min(formatOp.data.start, otherDelete.data.position),
            end: Math.max(formatOp.data.start, formatOp.data.end - overlap),
          },
        };
      }
    }

    return formatOp;
  }

  /**
   * Compose two operations into one if possible
   */
  async composeOperations(
    op1: CollaborationOperation,
    op2: CollaborationOperation
  ): Promise<CollaborationOperation | null> {
    // Only compose operations from the same user
    if (op1.userId !== op2.userId) return null;

    // Compose consecutive text inserts at the same position
    if (op1.type === 'text_insert' && op2.type === 'text_insert') {
      const insert1 = op1 as TextInsertOperation;
      const insert2 = op2 as TextInsertOperation;

      if (
        insert2.data.position ===
        insert1.data.position + insert1.data.text.length
      ) {
        return {
          ...insert1,
          data: {
            ...insert1.data,
            text: insert1.data.text + insert2.data.text,
          },
          timestamp: insert2.timestamp,
        };
      }
    }

    // Compose consecutive text deletes
    if (op1.type === 'text_delete' && op2.type === 'text_delete') {
      const delete1 = op1 as TextDeleteOperation;
      const delete2 = op2 as TextDeleteOperation;

      if (delete2.data.position === delete1.data.position) {
        return {
          ...delete1,
          data: {
            ...delete1.data,
            length: delete1.data.length + delete2.data.length,
          },
          timestamp: delete2.timestamp,
        };
      }
    }

    return null;
  }

  /**
   * Validate an operation before applying it
   */
  async validateOperation(
    operation: CollaborationOperation,
    currentState: any
  ): Promise<boolean> {
    switch (operation.type) {
      case 'text_insert':
        const insertOp = operation as TextInsertOperation;
        return (
          insertOp.data.position >= 0 &&
          insertOp.data.position <= (currentState.text?.length || 0)
        );

      case 'text_delete':
        const deleteOp = operation as TextDeleteOperation;
        return (
          deleteOp.data.position >= 0 &&
          deleteOp.data.position + deleteOp.data.length <=
            (currentState.text?.length || 0)
        );

      case 'text_format':
        const formatOp = operation as TextFormatOperation;
        return (
          formatOp.data.start >= 0 &&
          formatOp.data.end <= (currentState.text?.length || 0) &&
          formatOp.data.start < formatOp.data.end
        );

      default:
        return true;
    }
  }
}
