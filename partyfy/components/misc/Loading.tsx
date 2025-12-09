import { Spinner } from "@/components/ui/spinner";

function Loading() {
    return (
      <div className="flex justify-center align-center p-10">
        <Spinner variant="wave" className="text-stone-400" />
      </div>
    );
}

export default Loading;