import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { ChartData } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const solvers = ['DEFAULT', 'LCG'];

interface SolverData {
  solver: string;
  optim?: number;
  best_bound?: number | null;
  time_best_bound?: number;
  status?: string;
  time?: number;
}

interface DataItem {
  solvers: SolverData[];
}

const extractCopData = (data: DataItem[], solvers: string[], timelimit = 1200) => {
  const result: Record<string, number[]> = { DEFAULT: [0, 0, 0, 0, 0], LCG: [0, 0, 0, 0, 0] };

  data.forEach(item => {
    const benchmarks: Record<string, { optim: number; best_bound: number | null; time_best_bound: number }> = {};
    solvers.forEach(solver => {
      const solverData = item.solvers.find(s => s.solver === solver);
      if (solverData) {
        benchmarks[solver] = {
          optim: solverData.optim ?? -1,
          best_bound: solverData.best_bound ?? null,
          time_best_bound: solverData.time_best_bound ?? timelimit,
        };
      } else {
        benchmarks[solver] = {
          optim: -1,
          best_bound: null,
          time_best_bound: timelimit,
        };
      }
    });

    Object.keys(benchmarks).forEach(solver => {
      const data = benchmarks[solver];
      if (data.optim !== -1) {
        result[solver][0] += 1; // Best
        result[solver][1] += 1; // Fastest
      } else {
        result[solver][4] += 1; // No sol
      }
    });
  });

  return result;
};

const extractCspData = (data: DataItem[], solvers: string[], timelimit = 1200) => {
  const result: Record<string, number[]> = { DEFAULT: [0, 0, 0, 0], LCG: [0, 0, 0, 0] };

  data.forEach(item => {
    const benchmarks: Record<string, { status: string; time: number }> = {};
    solvers.forEach(solver => {
      const solverData = item.solvers.find(s => s.solver === solver);
      if (solverData) {
        benchmarks[solver] = {
          status: solverData.status ?? 'UNKNOWN',
          time: solverData.time ?? timelimit,
        };
      } else {
        benchmarks[solver] = {
          status: 'UNKNOWN',
          time: timelimit,
        };
      }
    });

    Object.keys(benchmarks).forEach(solver => {
      const data = benchmarks[solver];
      if (data.status === 'SAT') {
        result[solver][0] += 1;
        result[solver][1] += 1;
      } else if (data.status === 'UNKNOWN') {
        result[solver][3] += 1;
      } else {
        result[solver][2] += 1;
      }
    });
  });

  return result;
};

const Visualisation = () => {
  const [copData, setCopData] = useState<DataItem[] | null>(null);
  const [cspData, setCspData] = useState<DataItem[] | null>(null);
  const [filesLoaded, setFilesLoaded] = useState({ cop: false, csp: false });

  const handleFileUpload = (acceptedFiles: File[], setter: React.Dispatch<React.SetStateAction<DataItem[] | null>>, fileType: 'cop' | 'csp') => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result;
      if (fileContent) {
        try {
          const jsonData: DataItem[] = JSON.parse(fileContent as string);
          setter(jsonData);
          setFilesLoaded(prevState => ({ ...prevState, [fileType]: true }));
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      }
    };
    reader.readAsText(file);
  };

  const { getRootProps: getRootPropsCop, getInputProps: getInputPropsCop } = useDropzone({
    accept: { 'application/json': ['.json'] },
    onDrop: (acceptedFiles) => handleFileUpload(acceptedFiles, setCopData, 'cop'),
  });

  const { getRootProps: getRootPropsCsp, getInputProps: getInputPropsCsp } = useDropzone({
    accept: { 'application/json': ['.json'] },
    onDrop: (acceptedFiles) => handleFileUpload(acceptedFiles, setCspData, 'csp'),
  });

  const createRadarData = (data: DataItem[] | null, isCop: boolean): ChartData<'radar', number[], string> => {
    if (!data) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const categories = isCop
      ? ['Best', 'Fastest', 'Slower', 'Worst', 'No sol']
      : ['Best', 'Fastest', 'Slower', 'No sol'];

    const extractedData = isCop ? extractCopData(data, solvers) : extractCspData(data, solvers);

    return {
      labels: categories,
      datasets: solvers.map((solver) => ({
        label: solver,
        data: extractedData[solver],
        fill: true,
        backgroundColor: solver === 'DEFAULT' ? 'rgba(54, 162, 235, 0.2)' : 'rgba(255, 99, 132, 0.2)',
        borderColor: solver === 'DEFAULT' ? 'rgb(54, 162, 235)' : 'rgb(255, 99, 132)',
        pointBackgroundColor: solver === 'DEFAULT' ? 'rgb(54, 162, 235)' : 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: solver === 'DEFAULT' ? 'rgb(54, 162, 235)' : 'rgb(255, 99, 132)',
      })),
    };
  };

  const isBothFilesLoaded = filesLoaded.cop && filesLoaded.csp;

  return (
    <div className="p-4 items-center justify-center h-full">
      <h1 className="text-2xl font-bold mb-4">Visualisation Result</h1>

      {!isBothFilesLoaded && (
        <>
          <div className="w-full max-w-md mb-4">
            <div {...getRootPropsCop()} className="border-dashed border-2 p-4 mb-4">
              <input {...getInputPropsCop()} />
              <p>Drag 'n' drop your COP file here, or click to select files</p>
            </div>
          </div>

          <div className="w-full max-w-md mb-4">
            <div {...getRootPropsCsp()} className="border-dashed border-2 p-4 mb-4">
              <input {...getInputPropsCsp()} />
              <p>Drag 'n' drop your CSP file here, or click to select files</p>
            </div>
          </div>
        </>
      )}

      {isBothFilesLoaded && (
        <div className="flex flex-wrap justify-center gap-8">
          <div className="w-full max-w-lg">
            <Radar
              data={createRadarData(copData, true)}
              options={{
                plugins: {
                  title: {
                    display: true,
                    text: `COP (${copData?.length ?? 0} instances)`,
                  },
                  legend: {
                    display: true,
                    position: 'top',
                  },
                },
                scales: {
                  r: {
                    angleLines: {
                      display: true,
                    },
                    suggestedMin: 0,
                    suggestedMax: 60,
                    ticks: {
                      backdropColor: 'transparent',
                    },
                  },
                },
              }}
            />
          </div>
          <div className="w-full max-w-lg">
            <Radar
              data={createRadarData(cspData, false)}
              options={{
                plugins: {
                  title: {
                    display: true,
                    text: `CSP (${cspData?.length ?? 0} instances)`,
                  },
                  legend: {
                    display: true,
                    position: 'top',
                  },
                },
                scales: {
                  r: {
                    angleLines: {
                      display: true,
                    },
                    suggestedMin: 0,
                    suggestedMax: 60,
                    ticks: {
                      backdropColor: 'transparent',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualisation;
