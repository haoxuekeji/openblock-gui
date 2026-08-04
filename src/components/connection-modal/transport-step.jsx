import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import Box from '../box/box.jsx';
import styles from './connection-modal.css';

const TransportStep = props => (
    <Box className={styles.body}>
        <Box className={styles.transportArea}>
            <div className={styles.transportTitle}>
                <FormattedMessage
                    defaultMessage="Choose a connection method"
                    description="Title for selecting a hardware connection transport"
                    id="gui.connection.transport.title"
                />
            </div>
            <div className={styles.transportDescription}>
                <FormattedMessage
                    defaultMessage={
                        'The blocks and generated code stay the same. ' +
                        'You can change the connection method later.'
                    }
                    description="Explanation shown above hardware transport choices"
                    id="gui.connection.transport.instructions"
                />
            </div>
            <div className={styles.transportList}>
                {props.methods.map(method => (
                    <button
                        className={classNames(styles.transportOption, {
                            [styles.transportOptionPreferred]: method.id === props.preferredTransportId
                        })}
                        data-transport-id={method.id}
                        key={method.id}
                        type="button"
                        onClick={props.onSelect}
                    >
                        <span className={styles.transportOptionHeader}>
                            <span className={styles.transportOptionName}>{method.name}</span>
                            {method.recommended ? (
                                <span className={styles.transportBadge}>
                                    <FormattedMessage
                                        defaultMessage="Recommended"
                                        description="Badge for the recommended hardware connection transport"
                                        id="gui.connection.transport.recommended"
                                    />
                                </span>
                            ) : null}
                        </span>
                        <span className={styles.transportOptionDescription}>{method.description}</span>
                    </button>
                ))}
            </div>
        </Box>
    </Box>
);

TransportStep.propTypes = {
    methods: PropTypes.arrayOf(PropTypes.shape({
        description: PropTypes.node.isRequired,
        id: PropTypes.string.isRequired,
        name: PropTypes.node.isRequired,
        recommended: PropTypes.bool
    })).isRequired,
    onSelect: PropTypes.func.isRequired,
    preferredTransportId: PropTypes.string
};

export default TransportStep;
