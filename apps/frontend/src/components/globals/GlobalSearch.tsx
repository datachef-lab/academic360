import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

import { Button } from "../ui/button";
import { Search } from "lucide-react";

export default function GlobalSearch() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="secondary" className="border">
          Search{" "}
          {window.innerWidth > 500 && (
            <p className="flex gap-5 items-center">
              something...
              <Search />
            </p>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        {/* <DialogHeader> */}
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>Calendar</CommandItem>
              <CommandItem>Search Emoji</CommandItem>
              <CommandItem>Calculator</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>Profile</CommandItem>
              <CommandItem>Billing</CommandItem>
              <CommandItem>Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        {/* </DialogHeader> */}
      </DialogContent>
    </Dialog>
  );
}
