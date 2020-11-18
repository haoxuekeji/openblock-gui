

class HX_Lib {
    test() {
        console.log('test')
    }
    onSpriteClick() {
        // console.log('test click')
		      //     window.projecturl = 'http://0.0.0.0:5000/api/v1/download/%E5%B0%8F%E6%98%8E.sprite3';
		      //     const url=window.projecturl;
		      //     fetch(url, {
		      //       method: 'GET'
		      //     })
		      //     .then(res => res.blob())
		      //     .then(blob => {
		      //       const reader = new FileReader();
		      //       reader.onload=()=> vm.addSprite(reader.result)
		      //       .then(() => {
		      //       })
		      //       reader.readAsArrayBuffer(blob)
		      //     })
		      //     .catch(error => {
		      //       alert('文件加载错误！ ${error}')
		      //     })
              if(window.openBox) {
                window.openBox('sprite')
              }
    }
    onBackdropClick(e) {
        if(window.openBox) {
            window.openBox('backdrop')
        }
    }
    opProjectClick() {
        if(window.openBox) {
            window.openBox('project')
        }
    }
    onSoundClick() {
        if(window.openBox) {
            window.openBox('sound')
        }
        
    }
}
export default new HX_Lib()
