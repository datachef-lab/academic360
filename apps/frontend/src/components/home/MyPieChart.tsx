import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPassingPercentageStats, PassingPercentageStats, YearlyPassingData } from "@/services/stats";
import { Loader2, ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, AlertCircleIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Professional color palette
const STREAM_COLORS = [
  "#4361ee", // Primary blue
  "#3a0ca3", // Deep purple
  "#7209b7", // Vibrant purple
  "#f72585", // Pink
  "#4cc9f0", // Light blue
  "#4895ef", // Sky blue
];

// Color for yearly trends
const YEARLY_COLORS = {
  bar: "#4361ee",
  increasing: "#10b981", // Success green
  decreasing: "#ef4444", // Danger red
  grid: "#e5e7eb",
};

export function MyPieChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{name: string, value: number}[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyPassingData[]>([]);
  const [statsData, setStatsData] = useState<PassingPercentageStats | null>(null);
  const [yearTrend, setYearTrend] = useState<'up' | 'down' | 'none'>('none');
  const [trendPercentage, setTrendPercentage] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getPassingPercentageStats();
        console.log("Passing percentage data:", data);
        
        // Format the stream-wise data for the pie chart
        const formattedData = data.streamWiseData.map(stream => ({
          name: stream.degreeName,
          subName: stream.streamName,
          value: stream.passingPercentage,
          streamId: stream.streamId,
          totalStudents: stream.totalStudents,
          passedStudents: stream.passedStudents
        }));
        
        // Calculate year-over-year trend if there are at least 2 years of data
        if (data.yearWiseData.length >= 2) {
          const sortedYears = [...data.yearWiseData].sort((a, b) => a.year - b.year);
          const lastYear = sortedYears[sortedYears.length - 1];
          const secondLastYear = sortedYears[sortedYears.length - 2];
          
          const difference = lastYear.passingPercentage - secondLastYear.passingPercentage;
          setYearTrend(difference > 0 ? 'up' : difference < 0 ? 'down' : 'none');
          setTrendPercentage(Math.abs(difference));
        }
        
        setChartData(formattedData);
        setYearlyData(data.yearWiseData.sort((a, b) => a.year - b.year));
        setStatsData(data);
      } catch (err) {
        console.error("Error fetching passing percentage data:", err);
        setError("Failed to load passing percentage data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="flex flex-col w-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading passing statistics...</p>
      </Card>
    );
  }

  if (error || !statsData) {
    return (
      <Card className="flex flex-col w-full min-h-[400px] items-center justify-center">
        <CardHeader className="items-center pb-0">
          <AlertCircleIcon className="h-10 w-10 text-destructive mb-2" />
          <CardTitle className="text-destructive">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error || "No data available"}</p>
        </CardContent>
      </Card>
    );
  }

  const averagePassingRate = statsData.passingPercentage;
  
  // Custom renderer for the stream names in the pie chart legend
  const renderColorfulLegendText = (value: string, entry: any) => {
    const { payload } = entry;
    const isAboveAverage = payload.value > averagePassingRate;
    
    return (
      <span className={cn(
        "text-sm font-medium",
        isAboveAverage ? "text-emerald-700" : "text-gray-600"
      )}>
        {value} ({payload.value.toFixed(1)}%)
      </span>
    );
  };

  return (
    <Card className="flex flex-col w-full shadow-md border-0">
      <CardHeader className="pb-0 pt-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div>
            <CardTitle className="text-xl font-bold text-gray-800">Academic Performance Analysis</CardTitle>
            <CardDescription className="mt-1">
              Assessment criteria: {statsData.metricUsed} ≥ {statsData.sgpaThreshold}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="bg-primary/10 font-semibold px-3 py-1">
              Overall Pass Rate: {statsData.passingPercentage.toFixed(1)}%
            </Badge>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-100 text-xs px-2 py-0.5">
                {statsData.passedStudents.toLocaleString()} of {statsData.totalStudents.toLocaleString()} Passed
              </Badge>
              {yearTrend !== 'none' && (
                <Badge variant={yearTrend === 'up' ? "default" : "destructive"} className="text-xs px-2 py-0.5 flex items-center gap-1">
                  {yearTrend === 'up' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                  {trendPercentage.toFixed(1)}% from last year
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="streams" className="w-full">
        <div className="px-6 pt-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="streams" className="text-sm font-medium">Stream Analysis</TabsTrigger>
            <TabsTrigger value="yearly" className="text-sm font-medium">Yearly Trends</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="streams" className="m-0">
          <CardContent className="flex justify-center pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    innerRadius={75}
                    fill="#8884d8"
                    paddingAngle={2}
                    label={({ value }) => `${value.toFixed(1)}%`}
                    labelLine={false}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STREAM_COLORS[index % STREAM_COLORS.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                    labelFormatter={(name) => `${name}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                      padding: '12px',
                      fontSize: '13px'
                    }}
                    itemStyle={{ padding: '4px 0' }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    formatter={renderColorfulLegendText}
                    iconSize={12}
                    iconType="circle"
                    wrapperStyle={{
                      paddingLeft: '20px',
                      fontSize: '13px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[380px] flex items-center justify-center">
                <p className="text-muted-foreground">No stream data available</p>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="yearly" className="m-0">
          <CardContent className="flex justify-center pt-4">
            {yearlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart 
                  data={yearlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={YEARLY_COLORS.grid} />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tickFormatter={(value) => `${value}%`} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                    labelFormatter={(year) => `Year ${year}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                      padding: '12px',
                      fontSize: '13px'
                    }}
                  />
                  <Bar 
                    name="Passing Rate" 
                    dataKey="passingPercentage" 
                    fill={YEARLY_COLORS.bar}
                    radius={[4, 4, 0, 0]}
                    barSize={60}
                  >
                    <LabelList 
                      dataKey="passingPercentage" 
                      position="top" 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      style={{ fontSize: '12px', fill: '#6b7280' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[380px] flex items-center justify-center">
                <p className="text-muted-foreground">No yearly data available</p>
              </div>
            )}
          </CardContent>
          
          <div className="px-6 pb-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {yearlyData.map((year) => (
                <Card key={year.year} className="bg-gray-50 border-0 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-800">{year.year}</h3>
                      <Badge 
                        variant={year.passingPercentage >= averagePassingRate ? "default" : "outline"} 
                        className={cn(
                          "text-xs",
                          year.passingPercentage >= averagePassingRate ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {year.passingPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div className="flex justify-between mb-1">
                        <span>Total Students:</span>
                        <span className="font-medium">{year.totalStudents.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Passed:</span>
                        <span className="font-medium text-emerald-700">{year.passedStudents.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed:</span>
                        <span className="font-medium text-gray-700">{year.failedStudents.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div 
                    className="h-1" 
                    style={{ 
                      width: `${year.passingPercentage}%`, 
                      backgroundColor: year.passingPercentage >= averagePassingRate ? YEARLY_COLORS.increasing : YEARLY_COLORS.decreasing 
                    }}
                  />
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between text-xs text-gray-500 pt-2 px-6 pb-4 border-t mt-2">
        <div className="flex gap-4">
          <div>SGPA Range: <span className="font-medium">{parseFloat(statsData.sgpaStats.minSgpa).toFixed(2)} - {parseFloat(statsData.sgpaStats.maxSgpa).toFixed(2)}</span></div>
          <div>Avg: <span className="font-medium">{parseFloat(statsData.sgpaStats.avgSgpa).toFixed(2)}</span></div>
        </div>
        <div>
          <TrendingUpIcon className="h-3 w-3 inline mr-1" />
          <span>Based on {statsData.sgpaStats.nonNullCount.toLocaleString()} student records</span>
        </div>
      </CardFooter>
    </Card>
  );
}
