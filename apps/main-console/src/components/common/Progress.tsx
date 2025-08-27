import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
    progress: number;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
    return (
        <div className="w-full">
            <p className="text-sm text-gray-500 mb-2">Uploading... {progress.toFixed(2)}%</p>
            <Progress value={progress} />
        </div>
    );
};
