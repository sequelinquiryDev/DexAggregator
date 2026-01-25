import { Button } from './ui/button';

interface NetworkSelectorProps {
  selectedNetwork: number;
  onNetworkChange: (chainId: number) => void;
}

export function NetworkSelector({ selectedNetwork, onNetworkChange }: NetworkSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={selectedNetwork === 1 ? 'default' : 'outline'}
        onClick={() => onNetworkChange(1)}
        className="px-6"
      >
        Ethereum
      </Button>
      <Button
        variant={selectedNetwork === 137 ? 'default' : 'outline'}
        onClick={() => onNetworkChange(137)}
        className="px-6"
      >
        Polygon
      </Button>
    </div>
  );
}
