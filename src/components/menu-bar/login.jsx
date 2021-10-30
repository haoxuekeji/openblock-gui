const bindAll = require('lodash.bindall');
const FormattedMessage = require('react-intl').FormattedMessage;
const PropTypes = require('prop-types');
const React = require('react');

const styles = require('./login.css');
//require('./login.scss');

class Login extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleSubmit'
        ]);
        this.state = {
            waiting: false
        };
    }
    handleSubmit(e) {
        e.preventDefault();
        let form = {
            user: e.target.username.value,
            pwd: e.target.password.value,
        }
        this.setState({ waiting: true });
        this.props.onLogIn(form, this.props.onClose, (result) => {
            if (result.success === true) {
                this.props.onClose()

            }
            this.setState({ waiting: false });
        });
    }
    render() {
        let error;
        if (this.props.error) {
            error = <div className="error">{this.props.error}</div>;
        }
        return (
            <div className="login">
                <form onSubmit={this.handleSubmit}>
                    <label
                        htmlFor="username"
                        key="usernameLabel"
                    >
                        <FormattedMessage id="general.username" />
                    </label>
                    <br />
                    <input
                        className={styles.minInput}
                        required
                        key="usernameInput"
                        maxLength="30"
                        name="username"
                        type="text"
                    /><br />
                    <label
                        htmlFor="password"
                        key="passwordLabel"
                    >
                        <FormattedMessage id="general.password" />
                    </label>
                    <br />
                    <input
                        className={styles.minInput}
                        required
                        key="passwordInput"
                        name="password"
                        type="password"
                    /><br />

                    <button
                        className={styles.btnSubmit}
                        type="submit" disabled={this.state.waiting}>登录</button>
                </form>
            </div>
        );
    }
}

Login.propTypes = {
    onLogIn: PropTypes.func,
    onClose: PropTypes.func,
};

module.exports = Login;
