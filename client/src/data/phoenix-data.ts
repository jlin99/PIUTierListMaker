import { Chart } from './data-types';

// Import Phoenix data
import phoenixData from './pump-phoenix.json';

// Process Phoenix data into chart format
export function getPhoenixCharts(): Chart[] {
  const charts: Chart[] = [];
  
  for (const song of phoenixData.songs) {
    const singlesLevels: number[] = [];
    const doublesLevels: number[] = [];

    if (song.charts) {
      for (const chart of song.charts) {
        if (chart.diffClass === "S" && chart.style === "solo") {
          singlesLevels.push(Number(chart.lvl));
        } else if (chart.diffClass === "D" && chart.style === "solo") {
          doublesLevels.push(Number(chart.lvl));
        }
      }
    }

    // Skip songs without any charts
    if (singlesLevels.length === 0 && doublesLevels.length === 0) {
      continue;
    }

    charts.push({
      id: Number(song.saIndex),
      name: song.name,
      imagePath: song.jacket,
      singlesLevels: singlesLevels.length > 0 ? singlesLevels : null,
      doublesLevels: doublesLevels.length > 0 ? doublesLevels : null
    });
  }

  return charts;
}
