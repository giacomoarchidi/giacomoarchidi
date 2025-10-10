import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC, { 
  type IAgoraRTCClient, 
  type IAgoraRTCRemoteUser, 
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack
} from 'agora-rtc-sdk-ng';
import { videoApi, type JoinRoomResponse } from '../../api/video';
import { useAuthStore } from '../../store/authStore';

const VideoRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Agora states
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  
  // UI states
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining] = useState<string>('');
  
  // Refs
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  // Join room data
  const [joinData, setJoinData] = useState<JoinRoomResponse | null>(null);

  // Load join room data
  useEffect(() => {
    const loadJoinData = async () => {
      if (!lessonId) return;
      
      try {
        setIsLoading(true);
        const data = await videoApi.joinRoom(Number(lessonId));
        setJoinData(data);
      } catch (err: any) {
        console.error('Errore join room:', err);
        setError(err.response?.data?.detail || 'Errore nel join della video room');
        setIsLoading(false);
      }
    };

    loadJoinData();
  }, [lessonId]);

  // Initialize Agora client
  useEffect(() => {
    if (!joinData) return;

    const initAgora = async () => {
      try {
        // Create Agora client
        const agoraClient = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8'
        });

        // Create local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          {},
          {
            encoderConfig: '720p_1'
          }
        );

        setClient(agoraClient);
        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);

        // Set up event listeners
        agoraClient.on('user-published', handleUserPublished);
        agoraClient.on('user-unpublished', handleUserUnpublished);
        agoraClient.on('user-left', handleUserLeft);

        // Join channel
        await agoraClient.join(
          joinData.app_id,
          joinData.channel,
          joinData.token,
          joinData.uid
        );

        // Publish local tracks
        await agoraClient.publish([audioTrack, videoTrack]);
        console.log('✅ Track pubblicati sul channel');

        // Play local video - aspetta un momento che il DOM sia pronto
        setTimeout(() => {
          if (localVideoRef.current) {
            console.log('▶️ Playing local video nel div:', localVideoRef.current);
            try {
              videoTrack.play(localVideoRef.current, { fit: 'cover' });
              console.log('✅ Video.play() chiamato');
              
              // Verifica che il video sia realmente visibile
              setTimeout(() => {
                const videoElement = localVideoRef.current?.querySelector('video');
                if (videoElement) {
                  console.log('✅ Elemento <video> trovato nel DOM:', {
                    width: videoElement.videoWidth,
                    height: videoElement.videoHeight,
                    paused: videoElement.paused
                  });
                } else {
                  console.warn('⚠️ Elemento <video> NON trovato nel DOM!');
                }
              }, 500);
            } catch (e) {
              console.error('❌ Errore durante play():', e);
            }
          } else {
            console.warn('⚠️ localVideoRef.current è null!');
          }
        }, 100);

        setIsLoading(false);
        setError(null);
        console.log('✅ Agora inizializzato con successo!');

      } catch (err: any) {
        console.error('❌ Errore inizializzazione Agora:', err);
        setError('Errore nella connessione video');
        setIsLoading(false);
      }
    };

    initAgora();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleanup video room...');
      
      // Stop e chiudi tutti i track
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        console.log('✅ Local video track chiuso nel cleanup');
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        console.log('✅ Local audio track chiuso nel cleanup');
      }
      
      // Leave dal channel
      if (client) {
        client.leave().catch(e => console.log('Errore leave (ignorato):', e));
        client.removeAllListeners();
        console.log('✅ Client Agora pulito');
      }
    };
  }, [joinData]);

  // Event handlers
  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    await client?.subscribe(user, mediaType);
    
    if (mediaType === 'video' && user.videoTrack) {
      setRemoteUsers(prev => [...prev, user]);
      if (remoteVideoRef.current) {
        user.videoTrack.play(remoteVideoRef.current);
      }
    }
    
    if (mediaType === 'audio' && user.audioTrack) {
      user.audioTrack.play();
    }
  };

  const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'video') {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    }
  };

  const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
  };

  // Control handlers
  const toggleVideo = async () => {
    console.log('📹 Toggle video, stato attuale:', isVideoOn);
    if (localVideoTrack) {
      if (isVideoOn) {
        await localVideoTrack.setEnabled(false);
        console.log('📹 Video disabilitato');
      } else {
        await localVideoTrack.setEnabled(true);
        console.log('📹 Video abilitato');
      }
      setIsVideoOn(!isVideoOn);
    } else {
      console.warn('⚠️ localVideoTrack è null!');
    }
  };

  const toggleAudio = async () => {
    console.log('🎤 Toggle audio, stato attuale:', isAudioOn);
    if (localAudioTrack) {
      if (isAudioOn) {
        await localAudioTrack.setEnabled(false);
        console.log('🎤 Audio disabilitato');
      } else {
        await localAudioTrack.setEnabled(true);
        console.log('🎤 Audio abilitato');
      }
      setIsAudioOn(!isAudioOn);
    } else {
      console.warn('⚠️ localAudioTrack è null!');
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "auto");
        if (localVideoTrack) {
          await client?.unpublish([localVideoTrack]);
          localVideoTrack.close();
        }
        await client?.publish([screenTrack]);
        setLocalVideoTrack(screenTrack);
        if (localVideoRef.current) {
          screenTrack.play(localVideoRef.current);
        }
        setIsScreenSharing(true);
      } else {
        const cameraTrack = await AgoraRTC.createCameraVideoTrack();
        if (localVideoTrack) {
          await client?.unpublish([localVideoTrack]);
          localVideoTrack.close();
        }
        await client?.publish([cameraTrack]);
        setLocalVideoTrack(cameraTrack);
        if (localVideoRef.current) {
          cameraTrack.play(localVideoRef.current);
        }
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error('Errore screen sharing:', err);
    }
  };

  const toggleRecording = async () => {
    try {
      if (!isRecording) {
        await videoApi.startRecording(Number(lessonId));
        setIsRecording(true);
      } else {
        await videoApi.stopRecording(Number(lessonId));
        setIsRecording(false);
      }
    } catch (err) {
      console.error('Errore recording:', err);
    }
  };

  const leaveRoom = async () => {
    try {
      console.log('📤 Uscita dalla video room...');
      
      // Stop e chiudi tutti i track locali
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        console.log('✅ Video track chiuso');
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        console.log('✅ Audio track chiuso');
      }
      
      // Leave dal channel Agora
      if (client) {
        await client.leave();
        client.removeAllListeners();
        console.log('✅ Uscito dal channel Agora');
      }
      
      // Naviga alla dashboard appropriata
      const user = useAuthStore.getState().user;
      if (user?.role === 'tutor') {
        navigate('/tutor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error('❌ Errore leave room:', err);
      // Prova comunque a navigare
      navigate(-1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Connessione alla video room...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 p-8 rounded-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl mb-4">Errore Connessione</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Torna Indietro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="text-white">
          <h1 className="text-xl font-bold">Video Lezione</h1>
          <p className="text-sm text-gray-300">Lezione #{lessonId}</p>
        </div>
        <div className="text-white text-right">
          <p className="text-sm">{timeRemaining}</p>
          <p className="text-xs text-gray-400">Partecipanti: {remoteUsers.length + 1}</p>
        </div>
      </div>

      {/* Video Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <div 
              ref={localVideoRef} 
              className="w-full h-64 lg:h-96"
              style={{ minHeight: '256px', backgroundColor: '#1f2937' }}
            >
              {/* Placeholder quando non c'è video */}
              {!isVideoOn && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-6xl">📹</div>
                </div>
              )}
            </div>
            
            {/* Nome utente */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {user?.first_name} {user?.last_name} (Tu)
            </div>
            
            {/* Indicatori stato microfono e video */}
            <div className="absolute top-2 right-2 flex space-x-2">
              {!isAudioOn && (
                <div className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-1 animate-pulse">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-bold">Muto</span>
                </div>
              )}
              {!isVideoOn && (
                <div className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-1">
                  <span className="text-sm font-bold">📹 OFF</span>
                </div>
              )}
            </div>
          </div>

          {/* Remote Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            {remoteUsers.length > 0 ? (
              <div ref={remoteVideoRef} className="w-full h-64 lg:h-96" />
            ) : (
              <div className="w-full h-64 lg:h-96 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-2">👤</div>
                  <p>In attesa di partecipanti...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-center space-x-4">
            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${
                isVideoOn ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
              } hover:opacity-80 transition-opacity`}
            >
              {isVideoOn ? '📹' : '📹'}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${
                isAudioOn ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
              } hover:opacity-80 transition-opacity`}
            >
              {isAudioOn ? '🎤' : '🎤'}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-full ${
                isScreenSharing ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-white'
              } hover:opacity-80 transition-opacity`}
            >
              📺
            </button>

            {/* Recording (solo tutor) */}
            {user?.role === 'tutor' && (
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-full ${
                  isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-600 text-white'
                } hover:opacity-80 transition-opacity`}
              >
                🔴
              </button>
            )}

            {/* Leave Room */}
            <button
              onClick={leaveRoom}
              className="p-3 rounded-full bg-red-600 text-white hover:opacity-80 transition-opacity"
            >
              📞
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
