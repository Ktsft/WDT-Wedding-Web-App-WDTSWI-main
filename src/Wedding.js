import { useEffect, useState, useCallback, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCircleCheck, faCircleXmark, faCheck, faX, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faImages } from '@fortawesome/free-regular-svg-icons';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const Wedding = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [croppedImageURL, setCroppedImageURL] = useState(null);
  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Get the cropped image URL
  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(e.target.files[0]);
      setModalIsOpen(true);
      e.target.value = '';
    }
  };

  // Get the cropped image blob
  const saveCroppedImage = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedImageURL(croppedImageBlob); // Set the cropped image URL
      setModalIsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Close the modal
  const closeModal = () => {
    setModalIsOpen(false);
  };

  // set all the input value
  const [msg, setMsg] = useState([]);
  const [params, setParams] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const messageRow = useRef();
  const [settings, setSettings] = useState({
    logo: '',
    mainImg: '',
    background: '',
    submit: '',
    dropdown: '',
    greeting: '',
    name: '',
    welcome: '',
    loaded: false
  });
  const [modalShow, setModalShow] = useState({
    show: false,
    type: 'success',
    message: [],
    title: '',
    button: '',
    icon: ''
  });
  const resizeTextarea = () => {
    messageRow.current.style.height = 'inherit';
    messageRow.current.style.height = messageRow.current.scrollHeight + 2 + 'px';
  }
  const handleSubmit = () => {
    // set store date time to localstorage
    const currentDateTime = new Date();
    const storedDateTime = localStorage.getItem('submitDateTime');

    if (storedDateTime) {
      const storedTime = new Date(storedDateTime);
      const timeDifference = (currentDateTime - storedTime) / 1000; // Convert milliseconds to seconds
      console.log('timeDifference', timeDifference);

      // Check if time difference is less than 15 seconds, will not allow to submit
      if (timeDifference <= 15) {
        setModalShow({
          show: true,
          type: 'error',
          message: ['Thank you for your blessing.', 'Kindly wait for the next blessing ready in 15s'],
          title: 'Error',
          button: 'Try Again',
          icon: ''
        });
        return; // Stop the execution if time difference is less or equal to 15 seconds
      }
    }

    // Proceed with the submission
    const paramsForm = new URLSearchParams();
    paramsForm.append('roomId', params);
    paramsForm.append('senderName', name);
    paramsForm.append('senderImg', croppedImageURL);
    paramsForm.append('content', message);
    paramsForm.append('message_status', 0);

    // submit the form
    fetch('https://web-intractive-system-app-api.onrender.com/greeting/create', {
      method: 'POST',
      body: paramsForm,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP status ' + response.status);
        }
        setModalShow({
          show: true,
          type: 'success',
          message: ['Your message has been received.', 'We will update shortly'],
          title: 'Thank You',
          button: 'Go Home',
          icon: ''
        });
        localStorage.setItem('submitDateTime', currentDateTime.toString()); // Store the current date time
        resetForm();
      })
      .catch(() => {
        setModalShow({
          show: true,
          type: 'error',
          message: ['Submission contains restricted word.', 'Please try again.'],
          title: 'Error',
          button: 'Try Again',
          icon: ''
        });
      });
  };
  // reset the form after submission 
  const resetForm = () => {
    setName('');
    setMessage('');
    setCroppedImageURL('');
    if (document.querySelector('input[type="radio"]:checked')) {
      messageRow.current.style.height = '46px'
      document.querySelector('input[type="radio"]:checked').checked = false;
    }
  }

  useEffect(() => {
    // get the room id from url
    const params = new URLSearchParams(window.location.search);
    if (!params.get('room')) {
      return;
    }
    setParams(params.get('room'));
    // get the room setting
    const fetchData = async () => {
      const response = await fetch(`https://web-intractive-system-app-api.onrender.com/roomSetting/get/${params.get('room')}`);
      const resp = await response.json();
      // set the room setting
      setSettings({
        logo: resp.app_logo_img,
        mainImg: resp.cover_photo_img,
        background: resp.background_img,
        submit: resp.submit_button,
        dropdown: resp.dropdown_highlight_color,
        greeting: resp.greeting_scroll_background_color,
        name: resp.name_icon_color,
        welcome: resp.welcome_text_color,
        loaded: true
      });
      // get the room status
      const roomResp = await fetch(`https://web-intractive-system-app-api.onrender.com/room/get/${params.get('room')}`);
      const room = await roomResp.json();
      if (room.room_status === 0) {
        setModalShow({
          show: true,
          type: 'Warning',
          message: ['This room is not available.', 'Please try again later.'],
          title: 'Warning',
          icon: ''
        });
      }
      if (room.default_greeting) {
        let msgArray = room.default_greeting.replace(/^"|"$/g, '');
        msgArray = msgArray.split("|");
        setMsg(msgArray);
      }
    }
    fetchData();



  }, []);
  return (
    <div className="w-screen min-h-screen bg-cover select-none" style={{
      '--theme-shade-1': settings.welcome,
      '--theme-shade-2': `${settings.welcome}b3`,
      '--theme-shade-3': `${settings.welcome}80`,
      '--theme-shade-4': `${settings.welcome}4d`,
      '--theme-shade-5': `${settings.welcome}1a`,
      '--theme-shade-6': `${settings.welcome}0d`,
      '--theme-name': settings.name,
      '--theme-dropdown': settings.dropdown,
      '--theme-greeting': settings.greeting,
      '--error-color': '#e51c69',
      '--success-color': '#4ccc86',
      '--warning-color': '#ffc107',
      'backgroundImage': `url("${settings.background}")`
    }}>
      {settings.loaded && <>
        {/* {settings.logo && <header className="text-center">
          <img src={settings.logo} alt="logo" className="inline-block" />
        </header>} */}
        <div className="max-w-md m-auto pb-0 pt-5">
          <div className="text-center pl-5 pr-5">
            <img src={settings.mainImg} alt="cover" className="inline-block w-60" />
          </div>
          <form action="" method="POST" onSubmit={(e) => {
            e.preventDefault();
            handleSubmit()
            // setModalShow({
            //   show: true,
            //   type: success ? 'success' : 'error',
            //   message: success ? ['Your message has been received.', 'We will update shortly'] : ['Submission contains restricted word.', 'Please try again.'],
            //   title: success ? 'Thank You' : 'Error',
            //   button: success ? 'Go Home' : 'Try Again',
            //   icon: ''
            // })
            // console.log(success);
          }} className="-mt-16 -mt- z-10 relative ml-1 mr-1 rounded-t-3xl backdrop-blur-sm border-4 border-b-0 border-white/60 bg-[color:var(--theme-shade-6)]">
            <div className="p-6 flex flex-col relative overflow-hidden pb-0" style={{ minHeight: 'calc(100vh - 136px)' }}>
              <input id="fileUpload" accept="image/*" type="file" className="hidden" onChange={onFileChange} />
              {croppedImageURL ? <div className="bg-transparent rounded-xl p-5 block relative flex justify-center">
                <label htmlFor="fileUpload" >
                  <img className='rounded-xl' src={croppedImageURL} alt="Cropped" />
                </label>

              </div> :
                <label htmlFor="fileUpload" className="bg-white rounded-xl p-5 block relative">
                  <div className="p-5 border border-dashed border-[color:var(--theme-shade-4)] rounded-xl text-center">
                    <FontAwesomeIcon icon={faImages} size="2x" className={`text-[color:var(--theme-shade-1)]`} />
                    <p className="text-xs mt-2 text-gray-600 font-semibold">Please insert your image, or <span className="text-[color:var(--theme-shade-1)]">take a photo</span></p>
                    <p className="text-[9px] text-gray-500">Supports JPG, PNG, TIFF, WEBP</p>
                  </div>
                </label>
              }
              <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                className="modal"
                overlayClassName="modal-overlay"
              >
                <div className="modal-content">
                  {imageSrc && (
                    <div className="crop-container">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropSize={{ width: 300, height: 300 }}
                        maxWidth={300}
                        maxHeight={300}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        showGrid={false}
                      // restrictPosition={false} 
                      />
                    </div>
                  )}
                  <div className="buttons-container">
                    <div className="p-10">
                      <button className="w-16 h-16 rounded-full 
                       bg-blue-600 hover:bg-blue-500 text-white" onClick={saveCroppedImage}>
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    </div>

                    <div className="p-10">
                      <button className="w-16 h-16 rounded-full 
                       bg-red-600 hover:bg-red-500 text-white" onClick={closeModal}>
                        <FontAwesomeIcon icon={faX} />
                      </button>
                    </div>
                  </div>
                </div>
              </Modal>

              <h1 className="text-center text-[color:var(--theme-shade-1)] font-bold text-sm mt-4 mb-4">Welcome, let's give wishes</h1>
              <div>
                <div className="relative mb-3">
                  <input id="name" type="text" autoComplete="off" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name"
                    className="bg-white p-3 text-gray-800 border border-transparent peer focus:border-[color:var(--theme-dropdown)] outline-none rounded-md w-full text-sm"
                  />
                  <label htmlFor="name" className="absolute right-2 top-1 p-1.5 bg-white mt-px text-gray-400 peer-focus:text-[color:var(--theme-name)]">
                    <FontAwesomeIcon icon={faUser} width={20} className="text-inherit" />
                  </label>
                </div>
                <div className="relative">
                  <textarea id="message" rows="1" ref={messageRow} type="text" autoComplete="off" required placeholder="Type Your Message" onChange={(e) => {
                    setMessage(e.target.value);
                    resizeTextarea();
                  }} value={message}
                    className="bg-white p-3 text-gray-800 resize-none border border-transparent focus:border-[color:var(--theme-dropdown)] outline-none rounded-md w-full text-sm">
                  </textarea>
                  <div className="rounded-md mt-3 bg-white p-3 pr-2 overflow-auto">
                    <SimpleBar style={{ maxHeight: 180, paddingLeft: 10, paddingRight: 20 }} autoHide={false}>
                      {msg.map((m, idx) => <div key={`msg-${idx}`}>
                        <input id={`msg-${idx}`} type="radio" name="msg" className={`hidden peer`} value={m} onChange={async (e) => {
                          if (e.target.checked) {
                            setMessage(e.target.value);
                            setTimeout(resizeTextarea, 5);
                          }
                        }} />
                        <label htmlFor={`msg-${idx}`} className={`rounded-md peer-checked:text-white peer-checked:bg-[color:var(--theme-dropdown)] text-gray-500 p-1 pl-5 pr-5 block`}>
                          <span className="text-sm block">{m}</span>
                        </label>
                        {idx < msg.length - 1 && <hr className="mt-2 mb-2 border-t border-t-gray-300" />}
                      </div>)}
                    </SimpleBar>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-5 text-center">
                <button type="submit" className="inline-block">
                  <img src={settings.submit} alt="send" width="100" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </>}
      <div className={`${modalShow.show ? '' : 'opacity-0 pointer-events-none'} flex transition-all duration-500 bottom-0 p-6 items-center justify-center fixed z-10 w-screen h-screen ${modalShow.type === 'Warning' ? 'bg-slate-200' : 'bg-black/80'} `}>
        <div className={`bg-white rounded-xl p-8 pt-12 pb-12 transition-all w-full max-w-sm duration-500 text-center ${modalShow.show ? '-mt-12' : 'mt-0'}`}>
          <FontAwesomeIcon
            icon={modalShow.type === 'success' ? faCircleCheck : modalShow.type === 'Warning' ? faCircleExclamation : faCircleXmark}
            width={88}
            className={`h-[88px] ${modalShow.type === 'success' ? 'text-[color:var(--success-color)]' : modalShow.type === 'Warning' ? 'text-[color:var(--warning-color)]' : 'text-[color:var(--error-color)]'}`}
          />
          <h2 className={`font-bold mt-8 text-2xl ${modalShow.type === 'error' ? 'text-[color:var(--error-color)]' : 'text-gray-700'}`}>{modalShow.title}</h2>
          <p className="text-gray-700 pb-8">
            {modalShow.message.map((line, index) => (
              <span key={index}>{line}<br /></span>
            ))}
          </p>
          {modalShow.button &&
            <button type="button"
              className={`rounded-md p-2 pl-8 pr-8 text-white ${modalShow.type === 'success' ? 'bg-[color:var(--success-color)]' : 'bg-[color:var(--error-color)]'}`}
              onClick={() => {
                setModalShow((prevState) => {
                  return { ...prevState, show: false }
                });
                // if (modalShow.type === 'success') {
                //   window.close();
                // }
              }}>{modalShow.button}</button>
          }
        </div>
      </div>
      <div className={`flex items-center flex-col justify-center fixed z-10 w-screen bg-white top-0 h-screen transition-all duration-1000 ${settings.loaded ? '-left-full' : 'left-0'}`}>
        <span className="text-4xl text-red-600 relative">
          <span className="inline-block animate-bounce">&#10084;</span>
          <span className="inline-block animate-[bounce_1s_linear_0.2s_infinite]">&#10084;</span>
          <span className="inline-block animate-[bounce_1s_linear_0.4s_infinite]">&#10084;</span>
        </span>
        <h3 className="text-xl">Loading...</h3>
      </div>
    </div >
  );
}

export default Wedding;
