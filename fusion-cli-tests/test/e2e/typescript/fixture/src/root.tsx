import React from 'react'

interface Props {
    greeting: string
}

const Some = ({greeting}: Props) => {
    return <div>{greeting}</div>
}

export default <Some greeting="Hello world!" />
