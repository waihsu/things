import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/things_web/components/ui/dialog";
import { Button } from "@/src/things_web/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/src/things_web/components/ui/input";
import { Textarea } from "@/src/things_web/components/ui/textarea";

export default function CreateDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="
          w-12 h-12
          rounded-full
          bg-white text-black
          flex items-center justify-center
          shadow-xl
          -mt-6
        "
        >
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle>Create post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input placeholder="Title" />
          <Textarea placeholder="What's on your mind?" />

          <Button className="w-full">Publish</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
