import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'

function App() {
  const [channelId, setChannelId] = useState(null)
  const [channelData, setChannelData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const { process_id } = useParams()

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('youtube_prep')
          .select('status, channel_id, channel_data')
          .eq('process_id', process_id)
          .single()

        if (error) throw error

        if (data && data.status === 'waiting') {
          setChannelId(data.channel_id)
          setChannelData(JSON.parse(data.channel_data))
        }
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (process_id) {
      fetchData()
    }
  }, [process_id])

  const handleImageClick = (index) => {
    setSelectedImage(index)
  }

  const handleSubmit = async () => {
    if (selectedImage === null) {
      alert('Please select an image first.')
      return
    }

    await updateStatus('selected', channelData.list_of_files[selectedImage].file_id)
  }

  const handleReject = async () => {
    await updateStatus('rejected')
  }

  const updateStatus = async (status, user_choice = null) => {
    setLoading(true)
    try {
      const updateData = { status }
      if (user_choice) {
        updateData.user_choice = user_choice
      }

      const { error } = await supabase
        .from('youtube_prep')
        .update(updateData)
        .eq('process_id', process_id)

      if (error) throw error

      alert(`Process ${status} successfully!`)
    } catch (error) {
      alert('Error updating status: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!channelId || !channelData) return <div>Allready solved or No data to display</div>

  return (
    <div>
      <h1>Process Viewer</h1>
      <p>Channel ID: {channelId}</p>
      <h2>Channel Information</h2>
      <p>Author: {channelData.author}</p>
      <p>Channel Name: {channelData.channel_name}</p>
      <p>Video Length: {channelData.video_lenght_in_seconds} seconds</p>
      <p>Max File Size: {channelData.max_file_size} seconds</p>
      <p>FPS: {channelData.fps}</p>
      <p>Prompt: {channelData.stability_prompt}</p>
      <h2>Images</h2>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        gap: '20px'
      }}>
        {channelData.list_of_files.map((file, index) => (
          <div 
            key={file.file_id} 
            style={{ 
              width: '400px', 
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            <img 
              src={file.s3_url} 
              alt={`Frame ${file.file_id}`} 
              style={{ 
                width: '100%', 
                height: 'auto',
                border: selectedImage === index ? '4px solid green' : 'none',
                cursor: 'pointer'
              }}
              onClick={() => handleImageClick(index)}
            />
            <p>{file.name}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
        <button 
          onClick={handleSubmit} 
          disabled={selectedImage === null || loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Selection'}
        </button>
        <button 
          onClick={handleReject} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
    </div>
  )
}

export default App