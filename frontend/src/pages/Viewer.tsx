import { useParams } from 'react-router-dom';

const Viewer = () => {
  const { driveId } = useParams();
  const src = driveId
    ? `https://drive.google.com/file/d/${driveId}/preview`
    : '';

  return (
    <div className="w-screen h-screen bg-background">
      {src ? (
        <iframe
          title="Resource Preview"
          src={src}
          className="w-full h-full"
          allow="autoplay"
        />
      ) : (
        <div className="text-foreground p-4">Invalid resource</div>
      )}
    </div>
  );
};

export default Viewer;
