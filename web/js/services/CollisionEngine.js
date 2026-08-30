/**
 * CollisionEngine — Overlapping Time Interval Clustering & Multi-Column Bin-Packing.
 * Single Responsibility: Calculate side-by-side vertical column allocations for overlapping events
 * without clipping or occlusion.
 *
 * Implemented per UML 2.0 Activity & Component Specifications.
 */
class CollisionEngine {
  /**
   * Compute multi-column bin-packing positions for an array of items.
   * @param {Array<{startMin: number, endMin: number}>} items
   * @returns {Array<Object>} positioned items with colIndex and totalCols assigned
   */
  static computeColumns(items) {
    if (!items || items.length === 0) return [];

    // Sort by startMin ASC, then by duration DESC for stable packing
    const sorted = [...items].sort((a, b) => {
      if (a.startMin !== b.startMin) return a.startMin - b.startMin;
      return (b.endMin - b.startMin) - (a.endMin - a.startMin);
    });

    // 1. Group items into connected collision clusters
    const clusters = [];
    let currentCluster = [];
    let clusterEnd = -1;

    sorted.forEach(item => {
      if (currentCluster.length === 0) {
        currentCluster.push(item);
        clusterEnd = item.endMin;
      } else {
        if (item.startMin < clusterEnd) {
          // Overlaps current cluster
          currentCluster.push(item);
          clusterEnd = Math.max(clusterEnd, item.endMin);
        } else {
          // Disconnected -> start new cluster
          clusters.push(currentCluster);
          currentCluster = [item];
          clusterEnd = item.endMin;
        }
      }
    });

    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    // 2. Assign column index within each cluster using greedy first-fit
    const result = [];

    clusters.forEach(cluster => {
      const columns = []; // array tracking the latest endMin of each column

      cluster.forEach(item => {
        let placedCol = -1;

        for (let c = 0; c < columns.length; c++) {
          if (columns[c] <= item.startMin) {
            placedCol = c;
            columns[c] = item.endMin;
            break;
          }
        }

        if (placedCol === -1) {
          placedCol = columns.length;
          columns.push(item.endMin);
        }

        item.colIndex = placedCol;
      });

      const totalCols = Math.max(1, columns.length);
      cluster.forEach(item => {
        item.totalCols = totalCols;
        result.push(item);
      });
    });

    return result;
  }
}

window.CollisionEngine = CollisionEngine;
