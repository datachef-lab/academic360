import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getEnrollmentStats, StreamYearlyEnrollment } from "@/services/stats";

// Chart data type with properly typed total property
type ChartDataItem = {
  year: string;
  total: number;
  [degreeName: string]: string | number;
};

export function MyStackBarChart() {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degreeNames, setDegreeNames] = useState<string[]>([]);
  const [totalEnrollment, setTotalEnrollment] = useState(0);
  const [averageYearlyEnrollment, setAverageYearlyEnrollment] = useState(0);
  const [yearOverYearGrowth, setYearOverYearGrowth] = useState<number | null>(null);

  // Professional color palette
  const colorMap: Record<string, string> = {
    "BA": "#3366CC",      // Blue
    "BCOM": "#DC3912",    // Red
    "BSC": "#FF9900",     // Orange
    "BBA": "#109618",     // Green
    "MA": "#990099",      // Purple
    "MCOM": "#0099C6"     // Teal
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const enrollmentData = await getEnrollmentStats();
        
        if (!enrollmentData.streamYearlyEnrollment || enrollmentData.streamYearlyEnrollment.length === 0) {
          setError('No enrollment data available');
          setLoading(false);
          return;
        }
        
        // Extract all unique degree names
        const degrees = enrollmentData.streamYearlyEnrollment.map(item => item.degreeName);
        setDegreeNames(degrees);
        
        // Process data for the chart
        const transformedData = transformDataForChart(enrollmentData.streamYearlyEnrollment);
        
        // Calculate analytics
        calculateAnalytics(transformedData);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching enrollment data:', err);
        setError(err.message || 'Failed to load enrollment data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate key analytics from the data
  const calculateAnalytics = (data: ChartDataItem[]) => {
    if (data.length === 0) return;
    
    // Calculate total enrollment across all years and programs
    let total = 0;
    
    // Add total to each year's data
    const dataWithTotals = data.map(yearData => {
      const yearTotal = Object.entries(yearData)
        .filter(([key]) => key !== 'year' && key !== 'total')
        .reduce((sum, [_, value]) => sum + (Number(value) || 0), 0);
      
      total += yearTotal;
      // Make sure total is already assigned to avoid TypeScript errors
      return { ...yearData, total: yearTotal };
    });
    
    setChartData(dataWithTotals);
    setTotalEnrollment(total);
    
    // Calculate average yearly enrollment
    const avgYearly = Math.round(total / data.length);
    setAverageYearlyEnrollment(avgYearly);
    
    // Calculate year-over-year growth if we have at least 2 years of data
    if (data.length >= 2) {
      const lastYear = dataWithTotals[dataWithTotals.length - 1];
      const previousYear = dataWithTotals[dataWithTotals.length - 2];
      
      if (lastYear.total && previousYear.total) {
        const growth = ((lastYear.total - previousYear.total) / previousYear.total) * 100;
        setYearOverYearGrowth(Number(growth.toFixed(1)));
      }
    }
  };

  // Transform API data for the chart
  const transformDataForChart = (streamData: StreamYearlyEnrollment[]): ChartDataItem[] => {
    // Get all unique years from all streams
    const yearSet = new Set<string>();
    streamData.forEach(stream => {
      Object.keys(stream.yearlyData).forEach(year => yearSet.add(year));
    });

    // Sort years chronologically
    const years = Array.from(yearSet).sort();
    
    // Build chart data with one entry per year
    return years.map(year => {
      // Start with the year as the base object and initialize total
      const yearItem: ChartDataItem = { year, total: 0 };
      
      // Add each degree's enrollment count for this year
      streamData.forEach(stream => {
        // Use the enrollment count for this year, or 0 if not available
        yearItem[stream.degreeName] = stream.yearlyData[year] || 0;
      });
      
      return yearItem;
    });
  };

  if (loading) {
    return (
      <Card className="w-full shadow-sm border">
        <CardHeader className="pb-4">
          <CardTitle>Student Enrollment Analysis</CardTitle>
          <CardDescription>Loading enrollment data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Fetching enrollment statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-sm border">
        <CardHeader className="pb-4">
          <CardTitle>Student Enrollment Analysis</CardTitle>
          <CardDescription className="text-red-600">Data Error</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-red-500 bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <p className="font-medium mb-2">Unable to load enrollment data</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader className="pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-xl">Student Enrollment by Stream</CardTitle>
            <CardDescription className="mt-1">Year-wise enrollment trends analysis</CardDescription>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-md text-center">
              <p className="text-xs text-blue-600 font-medium">Total Enrolled</p>
              <p className="text-xl font-semibold text-blue-700">{totalEnrollment.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 p-3 rounded-md text-center">
              <p className="text-xs text-purple-600 font-medium">Yearly Average</p>
              <p className="text-xl font-semibold text-purple-700">{averageYearlyEnrollment.toLocaleString()}</p>
            </div>
            {yearOverYearGrowth !== null && (
              <div className={`p-3 rounded-md text-center ${yearOverYearGrowth >= 0 
                ? 'bg-green-50 border border-green-100' 
                : 'bg-red-50 border border-red-100'}`}
              >
                <p className="text-xs font-medium">YoY Growth</p>
                <p className={`text-xl font-semibold ${yearOverYearGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {yearOverYearGrowth >= 0 ? '+' : ''}{yearOverYearGrowth}%
                </p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              barGap={4}
              barCategoryGap={16}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year"
                tick={{ fill: '#666' }}
                tickLine={{ stroke: '#ccc' }}
                axisLine={{ stroke: '#ccc' }}
              >
                {/* <Label value="Academic Year" position="bottom" offset={20} style={{ fill: '#666' }} /> */}
              </XAxis>
              <YAxis
                tick={{ fill: '#666' }}
                tickLine={{ stroke: '#ccc' }}
                axisLine={{ stroke: '#ccc' }}
              >
                {/* <Label value="Number of Students" angle={-90} position="left" offset={-10} style={{ fill: '#666' }} /> */}
              </YAxis>
              <Tooltip 
                formatter={(value, name) => [`${Number(value).toLocaleString()} students`, name]}
                labelFormatter={(label) => `Year: ${label}`}
                contentStyle={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '10px' }}
              />
              <Legend 
                verticalAlign="bottom" 
                wrapperStyle={{ paddingTop: '10px' }}
              />
              <ReferenceLine 
                y={averageYearlyEnrollment} 
                label={{ value: 'Average', position: 'right', fill: '#666' }} 
                stroke="#666" 
                strokeDasharray="3 3" 
              />
              {degreeNames.map((degree) => (
                <Bar
                    key={degree}
                    dataKey={degree}
                    name={degree}
                    stackId="a"
                    fill={colorMap[degree] || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="border-t mt-4 pt-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {degreeNames.map((degree, i) => {
            // Calculate total for this degree program
            const programTotal = chartData.reduce((sum, yearData) => {
              return sum + (Number(yearData[degree]) || 0);
            }, 0);
            
            // Calculate percentage of overall enrollment
            const percentage = Math.round((programTotal / totalEnrollment) * 100);
            
            return (
              <div key={i} className="flex gap-2 items-center">
                <div 
                  style={{ backgroundColor: colorMap[degree] || '#999' }} 
                  className="w-4 h-4 rounded-sm"
                ></div>
                <div className="text-sm">
                  <span className="font-medium">{degree}:</span> {programTotal.toLocaleString()} 
                  <span className="text-gray-500 text-xs ml-1">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardFooter>
    </Card>
  );
}
