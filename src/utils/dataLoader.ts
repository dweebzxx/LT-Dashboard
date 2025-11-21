import Papa from 'papaparse';
import { SurveyResponse } from '../types/survey';

export const loadCSVData = async (file: File): Promise<SurveyResponse[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as SurveyResponse[];
        resolve(data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const loadDefaultCSV = async (): Promise<SurveyResponse[]> => {
  const response = await fetch('/data/LT_Survey_Results.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as SurveyResponse[];
        resolve(data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
