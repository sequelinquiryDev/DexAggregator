import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers } from "lucide-react";

interface ChainSelectorProps {
  selectedChain: string;
  onSelectChain: (chain: string) => void;
}

export function ChainSelector({ selectedChain, onSelectChain }: ChainSelectorProps) {
  return (
    <div className="flex items-center space-x-4 bg-card p-1.5 rounded-lg border border-border shadow-sm">
      <div className="flex items-center px-3 py-1.5 bg-primary/10 rounded-md">
        <Layers className="w-4 h-4 text-primary mr-2" />
        <span className="text-sm font-medium text-primary uppercase tracking-wider">Network</span>
      </div>
      
      <Select value={selectedChain} onValueChange={onSelectChain}>
        <SelectTrigger className="w-[180px] border-0 focus:ring-0 shadow-none bg-transparent font-medium">
          <SelectValue placeholder="Select chain" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ethereum" className="cursor-pointer">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              Ethereum
            </div>
          </SelectItem>
          <SelectItem value="polygon" className="cursor-pointer">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
              Polygon
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
