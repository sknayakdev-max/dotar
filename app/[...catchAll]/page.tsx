import ErrorPage from "@/components/ErrorPage";

export default function CatchAllNotFound() {
  return <ErrorPage statusCode={404} />;
}