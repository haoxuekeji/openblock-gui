
import baseModule from './baseModule'

class API extends baseModule {
	constructor(arg) {
		super(arg)
	}

  get_token(data) {
    return this.request('post', 'student-token', data)
  }

  getInfo(data) {
    return this.request('get', 'student-token', data)
  }

  del_token(data) {
    return this.request('delete', 'student-token', data)
  }

  put_token(data) {
    return this.request('put', 'student-token', data)
  }



  add_files(data) {
   return this.post('files', data)
  }
  del_files(data) {
   return this.request('delete', 'files', data)
  }

  download_file(url, data) {
    return this.get(url,data)
  }

  // 获取单选题信息
  get_single_info(data) {
    return this.request('get', 'single-info', data)
  }
  add_single_info(data) {
    return this.request('post', 'single-info', data)
  }
  put_single_info(data) {
    return this.request('put', 'single-info', data)
  }
  del_single_info(data) {
    return this.request('delete', 'single-info', data)
  }

  // 获取试卷信息
    get_paper_info(data) {
      return this.request('get', 'paper-info', data)
    }
    add_paper_info(data) {
      return this.request('post', 'paper-info', data)
    }
    put_paper_info(data) {
      return this.request('put', 'paper-info', data)
    }
    del_paper_info(data) {
      return this.request('delete', 'paper-info', data)
    }

    get_bank_data(data) {
        return this.request('get', 'bank-data', data)
    }
		//获取试卷试题信息
    get_paper_info_byid(data) {
        return this.request('get', 'paper-info-byid', data)
    }

    get_exam_file(data) {
      return this.request('get', 'operate-file', data)
    }

    //获取考试问题信息
    get_exam_que_info(data) {
      return this.request('get', 'exam-que-info', data)
    }
    //获取考试信息
    get_exam_info(data) {
      return this.request('get', 'exam-info', data)
    }

    //获取学生答案
    get_answer(data) {
      return this.request('get', 'exam-answer', data)
    }
    //保存答案
    save_answer(data) {
    	return this.request('post', 'exam-save-answer', data)
    }
    //获取学生考试信息
    get_student_exam_info(data) {
      return this.request('get', 'student-exam-info', data)
    }
    //插入学习考试信息
    insert_student_exam_info(data) {
      return this.request('post', 'student-exam-info', data)
    }
    //提交试卷
    submit_answer(data) {
    	return this.request('post', 'exam-submit-answer', data)
    }

		insert_student_paper_score(data) {
			return this.request('post', 'insert-student-paper-score', data)
		}



		get_paper_status_bystudent(data) {
			return this.request('get', 'student-paper-status', data)
		}

		get_paper_detail(data) {
			return this.request('get', 'paper/detail', data)
		}

		login(data) {
			return this.request('post', 'student-token', data)
		}

		logout(data) {
			return this.request('delete', 'student-token', data)
		}

		update_token(data) {
			return this.request('put', 'student-token', data)
		}

    get_learn_lession(data) {
      return this.request('get', 'learn-lession', data)
    }

    save_learn_file(data) {
      return this.request('post', 'learn-lession', data)
    }

    del_learn_file(data) {
      return this.request('delete', 'learn-lession', data)
    }

    update_learn_file(data) {
      return this.request('put', 'learn-lession', data)
    }

    get_lessionFile(data) {
      return this.request('get', 'lessionFile', data)
    }

    get_work_info(data) {
      return this.request('get', 'work-info', data)
    }

    get_lessions(data) {
      return this.request('get', 'lessions', data)
    }
    
    get_project(data) {
        return this.request('get', 'project', data)
    }

    get_topic_task(data) {
      return this.request('get', 'topic-task', data)
    }

}

export default new API()
