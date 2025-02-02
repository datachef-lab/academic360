type SettingsContentProps = {
  activeSetting: {
    label: string;
    icon: JSX.Element;
    endpoint: string;
  };
};

export default function SettingsContent({ activeSetting }: SettingsContentProps) {
  return <div>SettingsContent</div>;
}
