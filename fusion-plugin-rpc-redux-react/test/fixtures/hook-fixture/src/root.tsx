/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {useState, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {useRPCRedux} from '../../../..';

export default function Root() {
  return (
    <>
      <Handler />
      <Selector />
    </>
  );
}

// Use handler to get data
function Handler(props) {
  const handler = useRPCRedux('getUser');
  const [mounted, setMounted] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    handler().then((data) => {
      if (mounted) setData(data);
    });
    return () => setMounted(false);
  }, [handler]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{data && <div data-testid="user-data">{data.type}</div>}</>;
}

// Use selector to get data
function Selector(props) {
  const handler = useRPCRedux('getTrip');
  const state = useSelector(({trip}) => trip.data);

  useEffect(() => {
    handler();
  }, [handler]);

  return <>{state && <div data-testid="trip-data">{state.type}</div>}</>;
}
