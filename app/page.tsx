import VideoPlayer from "@/components/video-player"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Video Learning Platform</h1>
        <VideoPlayer
          videoSrc="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          videoTitle="Big Buck Bunny - Sample Lecture"
        />
      </div>
    </main>
  )
}
